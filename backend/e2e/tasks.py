"""
E2E Tests for Tasks System.
"""

import uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .base import E2ERunner


class TasksTests:
    """E2E tests for Tasks management system"""

    def __init__(self, runner: 'E2ERunner'):
        self.runner = runner
        self.config = runner.config
        self.adapter = runner.adapter

    def run_all(self):
        """Run all tasks tests"""
        self.test_project_creation()
        self.test_project_listing()
        self.test_task_creation()
        self.test_task_with_project()
        self.test_task_toggle()
        self.test_task_deletion()
        self.test_pomodoro_creation()
        self.test_stats()
        self.test_dashboard()
        self.test_workflow()

    def test_project_creation(self) -> bool:
        """Test: Create a project"""
        def test():
            project_name = f"Test Project {uuid.uuid4().hex[:8]}"
            result = self.adapter.post('/api/tasks-db/projects', {
                'name': project_name,
                'color': '#FF5733',
                'icon': '📝'
            })

            project_id = result.get("id")
            if project_id:
                self.runner.cleanup.register_project(project_id)

            self.runner.assert_true(
                result.get("success") or project_id,
                "Project should be created"
            )
            return True

        result = self.runner.run_test("Project Creation", test, "Project created")
        self.runner.add_result(result)
        return result.passed

    def test_project_listing(self) -> bool:
        """Test: List projects"""
        def test():
            # Create a project first
            project_name = f"List Test {uuid.uuid4().hex[:8]}"
            create_result = self.adapter.post('/api/tasks-db/projects', {'name': project_name})
            if create_result.get("id"):
                self.runner.cleanup.register_project(create_result["id"])

            # List projects
            result = self.adapter.get('/api/tasks-db/projects')
            self.runner.assert_true(
                "projects" in result or isinstance(result.get("projects"), list),
                "Should return projects list"
            )
            return True

        result = self.runner.run_test("Project Listing", test, "Projects listed")
        self.runner.add_result(result)
        return result.passed

    def test_task_creation(self) -> bool:
        """Test: Create a task"""
        def test():
            task_title = f"Test Task {uuid.uuid4().hex[:8]}"
            result = self.adapter.post('/api/tasks-db/tasks', {
                'title': task_title,
                'priority': 'high',
                'effort': 'M'
            })

            task_id = result.get("id")
            if task_id:
                self.runner.cleanup.register_task(task_id)

            self.runner.assert_true(
                result.get("success") or task_id,
                "Task should be created"
            )
            return True

        result = self.runner.run_test("Task Creation", test, "Task created")
        self.runner.add_result(result)
        return result.passed

    def test_task_with_project(self) -> bool:
        """Test: Create task linked to project"""
        def test():
            # Create project
            project = self.adapter.post('/api/tasks-db/projects', {
                'name': f'Project {uuid.uuid4().hex[:8]}'
            })
            project_id = project.get("id")
            if project_id:
                self.runner.cleanup.register_project(project_id)

            # Create task in project
            task = self.adapter.post('/api/tasks-db/tasks', {
                'title': f'Task in Project {uuid.uuid4().hex[:8]}',
                'project_id': project_id,
                'priority': 'medium',
                'effort': 'S'
            })
            task_id = task.get("id")
            if task_id:
                self.runner.cleanup.register_task(task_id)

            self.runner.assert_true(
                task.get("success") or task_id,
                "Task should be created in project"
            )
            return True

        result = self.runner.run_test("Task with Project", test, "Task linked to project")
        self.runner.add_result(result)
        return result.passed

    def test_task_toggle(self) -> bool:
        """Test: Toggle task completion"""
        def test():
            # Create task
            task = self.adapter.post('/api/tasks-db/tasks', {
                'title': f'Toggle Task {uuid.uuid4().hex[:8]}',
                'priority': 'medium',
                'effort': 'S'
            })
            task_id = task.get("id")
            if not task_id:
                raise AssertionError("Could not create task for toggle test")

            self.runner.cleanup.register_task(task_id)

            # Toggle
            toggle_result = self.adapter.post(f'/api/tasks-db/tasks/{task_id}/toggle')

            self.runner.assert_true(
                toggle_result.get("success") or "completed" in toggle_result,
                "Task should be toggled"
            )
            return True

        result = self.runner.run_test("Task Toggle", test, "Task toggled")
        self.runner.add_result(result)
        return result.passed

    def test_task_deletion(self) -> bool:
        """Test: Delete a task"""
        def test():
            # Create task
            task = self.adapter.post('/api/tasks-db/tasks', {
                'title': f'Delete Task {uuid.uuid4().hex[:8]}',
                'priority': 'low',
                'effort': 'S'
            })
            task_id = task.get("id")
            if not task_id:
                raise AssertionError("Could not create task for deletion test")

            # Delete (don't register for cleanup since we're deleting)
            delete_result = self.adapter.delete(f'/api/tasks-db/tasks/{task_id}')

            self.runner.assert_true(
                delete_result.get("success", False) or delete_result.get("_status_code") == 200,
                "Task should be deleted"
            )
            return True

        result = self.runner.run_test("Task Deletion", test, "Task deleted")
        self.runner.add_result(result)
        return result.passed

    def test_pomodoro_creation(self) -> bool:
        """Test: Create Pomodoro session"""
        def test():
            # Create task first
            task = self.adapter.post('/api/tasks-db/tasks', {
                'title': f'Pomodoro Task {uuid.uuid4().hex[:8]}',
                'priority': 'medium',
                'effort': 'M'
            })
            task_id = task.get("id")
            if task_id:
                self.runner.cleanup.register_task(task_id)

            # Create pomodoro
            pomodoro = self.adapter.post('/api/tasks-db/pomodoro', {
                'task_id': task_id,
                'duration': 25,
                'session_type': 'focus'
            })

            self.runner.assert_true(
                pomodoro.get("success") or pomodoro.get("id"),
                "Pomodoro session should be created"
            )
            return True

        result = self.runner.run_test("Pomodoro Creation", test, "Pomodoro created")
        self.runner.add_result(result)
        return result.passed

    def test_stats(self) -> bool:
        """Test: Get task statistics"""
        def test():
            result = self.adapter.get('/api/tasks-db/stats')
            self.runner.assert_true(
                "stats" in result or result.get("success"),
                "Should return stats"
            )
            return True

        result = self.runner.run_test("Task Stats", test, "Stats retrieved")
        self.runner.add_result(result)
        return result.passed

    def test_dashboard(self) -> bool:
        """Test: Get dashboard data"""
        def test():
            result = self.adapter.get('/api/tasks-db/dashboard')
            self.runner.assert_true(
                result.get("success") or "date" in result,
                "Should return dashboard data"
            )
            return True

        result = self.runner.run_test("Task Dashboard", test, "Dashboard retrieved")
        self.runner.add_result(result)
        return result.passed

    def test_workflow(self) -> bool:
        """Test: Complete workflow - project > task > complete > delete"""
        def test():
            unique = uuid.uuid4().hex[:8]

            # 1. Create project
            project = self.adapter.post('/api/tasks-db/projects', {
                'name': f'Workflow Project {unique}',
                'color': '#6366f1',
                'icon': '🚀'
            })
            project_id = project.get("id")
            self.runner.assert_true(project_id, "Project should have ID")

            # 2. Create tasks
            task_ids = []
            for i in range(3):
                task = self.adapter.post('/api/tasks-db/tasks', {
                    'title': f'Workflow Task {i+1} {unique}',
                    'project_id': project_id,
                    'priority': ['high', 'medium', 'low'][i],
                    'effort': 'S'
                })
                task_id = task.get("id")
                if task_id:
                    task_ids.append(task_id)

            self.runner.assert_greater(len(task_ids), 0, "Should create at least one task")

            # 3. Complete first task
            toggle = self.adapter.post(f'/api/tasks-db/tasks/{task_ids[0]}/toggle')
            self.runner.assert_true(
                toggle.get("success") or toggle.get("completed"),
                "Should toggle task"
            )

            # 4. Check stats
            stats = self.adapter.get('/api/tasks-db/stats')
            self.runner.assert_true("stats" in stats or stats.get("success"), "Should get stats")

            # 5. Cleanup
            for task_id in task_ids:
                self.adapter.delete(f'/api/tasks-db/tasks/{task_id}')
            self.adapter.delete(f'/api/tasks-db/projects/{project_id}')

            return True

        result = self.runner.run_test("Complete Workflow", test, "Workflow completed")
        self.runner.add_result(result)
        return result.passed
