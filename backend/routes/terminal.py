"""
Route WebSocket pour le terminal interactif avec Docker
"""
import asyncio
import docker
from docker.errors import NotFound, APIError
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import threading
import queue

router = APIRouter()

# Client Docker global
docker_client = None

def get_docker_client():
    """Récupère ou crée le client Docker"""
    global docker_client
    if docker_client is None:
        docker_client = docker.from_env()
    return docker_client


class DockerTerminalSession:
    """Gère une session terminal dans un conteneur Docker"""
    
    DEFAULT_IMAGE = "ubuntu:22.04"
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.container = None
        self.exec_instance = None
        self.output_queue = queue.Queue()
        self.input_queue = queue.Queue()
        self._running = False
        self._reader_thread = None
    
    def start(self) -> str:
        """Démarre le conteneur Docker et ouvre un shell interactif"""
        client = get_docker_client()
        container_name = f"terminal-{self.session_id}"
        
        # Supprimer l'ancien conteneur s'il existe
        try:
            old_container = client.containers.get(container_name)
            old_container.stop(timeout=1)
            old_container.remove(force=True)
        except NotFound:
            pass
        except Exception:
            pass
        
        # Créer un nouveau conteneur
        self.container = client.containers.run(
            self.DEFAULT_IMAGE,
            name=container_name,
            command="/bin/bash",
            stdin_open=True,
            tty=True,
            detach=True,
            mem_limit="256m",
            cpu_period=100000,
            cpu_quota=50000,
            privileged=False,
            network_mode="bridge",
            environment={
                "TERM": "xterm-256color",
                "PS1": "\\[\\033[01;32m\\]\\u@docker\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ "
            },
            labels={
                "app": "newmars-terminal",
                "session": self.session_id
            }
        )
        
        # Attacher au conteneur pour I/O
        self.exec_instance = self.container.attach_socket(
            params={'stdin': True, 'stdout': True, 'stderr': True, 'stream': True}
        )
        
        self._running = True
        
        # Thread pour lire l'output du conteneur
        self._reader_thread = threading.Thread(target=self._read_output, daemon=True)
        self._reader_thread.start()
        
        return "\033[32m● Conteneur Docker Ubuntu connecté\033[0m\r\n\r\n"
    
    def _read_output(self):
        """Thread qui lit l'output du conteneur"""
        try:
            while self._running:
                try:
                    data = self.exec_instance._sock.recv(4096)
                    if data:
                        self.output_queue.put(data.decode('utf-8', errors='replace'))
                    else:
                        break
                except Exception:
                    break
        finally:
            self._running = False
    
    def resize(self, rows: int, cols: int):
        """Redimensionne le terminal"""
        if self.container:
            try:
                self.container.resize(height=rows, width=cols)
            except Exception:
                pass
    
    def write(self, data: str):
        """Écrit des données dans le terminal"""
        if self.exec_instance and self._running:
            try:
                self.exec_instance._sock.send(data.encode())
            except Exception:
                self._running = False
    
    def read(self) -> str:
        """Lit les données du terminal (non-bloquant)"""
        output = ""
        try:
            while not self.output_queue.empty():
                output += self.output_queue.get_nowait()
        except queue.Empty:
            pass
        return output
    
    def stop(self):
        """Arrête et supprime le conteneur"""
        self._running = False
        
        if self.exec_instance:
            try:
                self.exec_instance.close()
            except Exception:
                pass
            self.exec_instance = None
        
        if self.container:
            try:
                self.container.stop(timeout=2)
                self.container.remove(force=True)
            except Exception:
                pass
            self.container = None
    
    @property
    def is_running(self) -> bool:
        return self._running


# Sessions actives
active_sessions: dict[str, DockerTerminalSession] = {}


@router.websocket("/ws/terminal/{session_id}")
async def terminal_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint pour le terminal Docker"""
    await websocket.accept()
    
    session = None
    
    try:
        # Créer la session
        if session_id in active_sessions:
            active_sessions[session_id].stop()
            del active_sessions[session_id]
        
        session = DockerTerminalSession(session_id)
        welcome_msg = session.start()
        active_sessions[session_id] = session
        
        await websocket.send_json({"type": "output", "data": welcome_msg})
        
        # Boucle principale
        while session.is_running:
            # Lire l'output
            output = session.read()
            if output:
                await websocket.send_json({"type": "output", "data": output})
            
            # Vérifier les messages du client
            try:
                message = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=0.05
                )
                
                if message.get("type") == "input":
                    session.write(message.get("data", ""))
                elif message.get("type") == "resize":
                    rows = message.get("rows", 24)
                    cols = message.get("cols", 80)
                    session.resize(rows, cols)
                    
            except asyncio.TimeoutError:
                pass
            
            await asyncio.sleep(0.02)
            
    except WebSocketDisconnect:
        print(f"Terminal {session_id} disconnected")
    except APIError as e:
        try:
            await websocket.send_json({"type": "error", "message": f"Docker: {e}"})
        except:
            pass
    except Exception as e:
        print(f"Terminal error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        if session_id in active_sessions:
            active_sessions[session_id].stop()
            del active_sessions[session_id]


@router.get("/sessions")
async def list_sessions():
    """Liste les sessions actives"""
    return {"sessions": list(active_sessions.keys()), "count": len(active_sessions)}


@router.delete("/sessions/{session_id}")
async def stop_session(session_id: str):
    """Arrête une session"""
    if session_id in active_sessions:
        active_sessions[session_id].stop()
        del active_sessions[session_id]
        return {"status": "stopped"}
    return {"status": "not_found"}


@router.get("/health")
async def terminal_health():
    """Vérifie Docker"""
    try:
        client = get_docker_client()
        client.ping()
        return {"status": "healthy", "docker": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
