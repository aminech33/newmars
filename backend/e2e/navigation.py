"""
E2E Tests for User Navigation / Journeys.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .base import E2ERunner


class NavigationTests:
    """E2E tests for user navigation and journeys"""

    def __init__(self, runner: 'E2ERunner'):
        self.runner = runner
        self.config = runner.config
        self.adapter = runner.adapter

    def run_all(self):
        """Run all navigation tests"""
        self.test_onboarding_journey()
        self.test_daily_routine()
        self.test_review_workflow()
        self.test_cross_module_navigation()

    def test_onboarding_journey(self) -> bool:
        """Test: New user onboarding journey"""
        def test():
            user_id = self.runner.generate_id("onboard")
            self.runner.cleanup.register_user(user_id)

            # Step 1: Health profile setup
            weight = self.adapter.post('/api/health/weight', {
                'weight': 72.0,
                'date': datetime.now().strftime('%Y-%m-%d')
            })
            self.runner.assert_true(
                weight.get("success") or weight.get("id"),
                "Should set initial weight"
            )

            # Step 2: Create first project
            project = self.adapter.post('/api/tasks-db/projects', {
                'name': 'Mon premier projet',
                'icon': '🎯',
                'color': '#6366f1'
            })
            project_id = project.get("id")
            if project_id:
                self.runner.cleanup.register_project(project_id)
            self.runner.assert_true(project_id, "Should create first project")

            # Step 3: Create first task
            task = self.adapter.post('/api/tasks-db/tasks', {
                'title': 'Ma premiere tache',
                'project_id': project_id,
                'priority': 'high',
                'effort': 'S'
            })
            task_id = task.get("id")
            if task_id:
                self.runner.cleanup.register_task(task_id)
            self.runner.assert_true(task_id, "Should create first task")

            # Step 4: First learning session
            self.adapter.start_session(user_id, self.config.topics)

            for i in range(5):
                topic = self.config.topics[i % len(self.config.topics)]
                params = self.adapter.get_next_question(user_id, topic, 0)
                self.adapter.submit_answer(user_id, topic, True, 10.0, params.get("difficulty", 1))

            stats = self.adapter.get_user_stats(user_id)
            self.runner.assert_greater(stats.get("total_xp", 0), 0, "Should earn XP")

            # Step 5: Log water
            water = self.adapter.post('/api/health/hydration', {'amount_ml': 500})
            self.runner.assert_true(water.get("success") or water.get("id"), "Should log water")

            return True

        result = self.runner.run_test("Onboarding Journey", test, "New user journey completed")
        self.runner.add_result(result)
        return result.passed

    def test_daily_routine(self) -> bool:
        """Test: Complete daily routine (morning to evening)"""
        def test():
            user_id = self.runner.generate_id("daily")
            self.runner.cleanup.register_user(user_id)
            today = datetime.now().strftime('%Y-%m-%d')

            # === MORNING ===

            # Weigh-in
            self.adapter.post('/api/health/weight', {'weight': 73.2, 'date': today})

            # Breakfast
            self.adapter.post('/api/health/meals', {
                'date': today,
                'meal_type': 'breakfast',
                'foods': [{'name': 'Cereales', 'calories': 300}]
            })

            # Morning water
            self.adapter.post('/api/health/hydration', {'amount_ml': 500})

            # Check tasks for the day
            tasks_result = self.adapter.get('/api/tasks-db/tasks')
            self.runner.assert_true("tasks" in tasks_result, "Should list tasks")

            # Morning learning session
            self.adapter.start_session(user_id, self.config.topics)
            for _ in range(10):
                topic = self.config.topics[0]
                params = self.adapter.get_next_question(user_id, topic, 30)
                self.adapter.submit_answer(user_id, topic, True, 8.0, params.get("difficulty", 2))

            # === AFTERNOON ===

            # Lunch
            self.adapter.post('/api/health/meals', {
                'date': today,
                'meal_type': 'lunch',
                'foods': [{'name': 'Salade composee', 'calories': 450}]
            })

            # Water
            self.adapter.post('/api/health/hydration', {'amount_ml': 750})

            # Work on task with Pomodoro
            task = self.adapter.post('/api/tasks-db/tasks', {
                'title': f'Tache du jour {uuid.uuid4().hex[:6]}',
                'priority': 'high',
                'effort': 'M'
            })
            task_id = task.get("id")
            if task_id:
                self.runner.cleanup.register_task(task_id)

                # Pomodoro session
                self.adapter.post('/api/tasks-db/pomodoro', {
                    'task_id': task_id,
                    'duration': 25,
                    'session_type': 'focus'
                })

                # Complete task
                self.adapter.post(f'/api/tasks-db/tasks/{task_id}/toggle')

            # === EVENING ===

            # Dinner
            self.adapter.post('/api/health/meals', {
                'date': today,
                'meal_type': 'dinner',
                'foods': [{'name': 'Poisson et legumes', 'calories': 400}]
            })

            # Evening water
            self.adapter.post('/api/health/hydration', {'amount_ml': 500})

            # Evening review session
            for _ in range(5):
                topic = self.config.topics[1]
                params = self.adapter.get_next_question(user_id, topic, 50)
                self.adapter.submit_answer(user_id, topic, True, 10.0, params.get("difficulty", 3))

            # Check dashboard
            health_dashboard = self.adapter.get('/api/health/dashboard')
            self.runner.assert_true(
                health_dashboard.get("success") or "weight" in health_dashboard,
                "Should get health summary"
            )

            tasks_dashboard = self.adapter.get('/api/tasks-db/dashboard')
            self.runner.assert_true(
                tasks_dashboard.get("success") or "date" in tasks_dashboard,
                "Should get tasks summary"
            )

            return True

        result = self.runner.run_test("Daily Routine", test, "Full day completed")
        self.runner.add_result(result)
        return result.passed

    def test_review_workflow(self) -> bool:
        """Test: Learning review workflow"""
        def test():
            user_id = self.runner.generate_id("review")
            self.runner.cleanup.register_user(user_id)

            # Initial learning (day 1 simulation)
            self.adapter.start_session(user_id, self.config.topics)

            for topic in self.config.topics:
                for _ in range(5):
                    params = self.adapter.get_next_question(user_id, topic, 20)
                    self.adapter.submit_answer(user_id, topic, True, 9.0, params.get("difficulty", 2))

            stats_before = self.adapter.get_user_stats(user_id)

            # Review session (day 2 simulation)
            for topic in self.config.topics:
                stats = self.adapter.get_user_stats(user_id)
                mastery = int(stats.get("mastery", {}).get(topic, 0) * 100)

                for _ in range(3):
                    params = self.adapter.get_next_question(user_id, topic, mastery)
                    # Higher difficulty in review
                    self.adapter.submit_answer(
                        user_id, topic, True, 7.0,
                        min(5, params.get("difficulty", 2) + 1)
                    )

            stats_after = self.adapter.get_user_stats(user_id)

            # Verify progress
            self.runner.assert_greater(
                stats_after.get("total_xp", 0),
                stats_before.get("total_xp", 0),
                "XP should increase after review"
            )

            return True

        result = self.runner.run_test("Review Workflow", test, "Review completed")
        self.runner.add_result(result)
        return result.passed

    def test_cross_module_navigation(self) -> bool:
        """Test: Navigation between different modules"""
        def test():
            user_id = self.runner.generate_id("cross")
            self.runner.cleanup.register_user(user_id)

            # Health -> Tasks -> Learning -> Health

            # 1. Start with health check
            health = self.adapter.get('/api/health/dashboard')
            self.runner.assert_true(
                health.get("success") or not health.get("error"),
                "Health module accessible"
            )

            # 2. Switch to tasks
            tasks = self.adapter.get('/api/tasks-db/tasks')
            self.runner.assert_true(
                "tasks" in tasks or tasks.get("success"),
                "Tasks module accessible"
            )

            # Create a task
            task = self.adapter.post('/api/tasks-db/tasks', {
                'title': f'Cross-module task {uuid.uuid4().hex[:6]}',
                'priority': 'medium',
                'effort': 'S'
            })
            if task.get("id"):
                self.runner.cleanup.register_task(task["id"])

            # 3. Switch to learning
            self.adapter.start_session(user_id, self.config.topics)
            params = self.adapter.get_next_question(user_id, "conjugaison", 50)
            self.runner.assert_true(
                "difficulty" in params,
                "Learning module accessible"
            )

            # Answer a question
            self.adapter.submit_answer(user_id, "conjugaison", True, 8.0, params.get("difficulty", 2))

            # 4. Back to health - log activity
            water = self.adapter.post('/api/health/hydration', {'amount_ml': 250})
            self.runner.assert_true(
                water.get("success") or water.get("id"),
                "Can return to health module"
            )

            # 5. Quick task check
            stats = self.adapter.get('/api/tasks-db/stats')
            self.runner.assert_true(
                "stats" in stats or stats.get("success"),
                "Can return to tasks module"
            )

            return True

        result = self.runner.run_test("Cross-Module Navigation", test, "All modules navigable")
        self.runner.add_result(result)
        return result.passed
