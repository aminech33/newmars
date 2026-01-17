"""
E2E Tests for Health Tracking System.
"""

from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .base import E2ERunner


class HealthTests:
    """E2E tests for Health tracking system"""

    def __init__(self, runner: 'E2ERunner'):
        self.runner = runner
        self.config = runner.config
        self.adapter = runner.adapter

    def run_all(self):
        """Run all health tests"""
        self.test_weight_entry()
        self.test_weight_listing()
        self.test_meal_entry()
        self.test_meal_listing()
        self.test_hydration()
        self.test_dashboard()
        self.test_daily_workflow()

    def test_weight_entry(self) -> bool:
        """Test: Add weight entry"""
        def test():
            today = datetime.now().strftime('%Y-%m-%d')
            result = self.adapter.post('/api/health/weight', {
                'date': today,
                'weight': 75.5,
                'source': 'test'
            })

            self.runner.assert_true(
                result.get("success") or result.get("id"),
                "Weight entry should be created"
            )
            return True

        result = self.runner.run_test("Weight Entry", test, "Weight recorded")
        self.runner.add_result(result)
        return result.passed

    def test_weight_listing(self) -> bool:
        """Test: List weight entries"""
        def test():
            result = self.adapter.get('/api/health/weight', {'limit': 10})

            self.runner.assert_true(
                "entries" in result or result.get("success"),
                "Should return weight entries"
            )
            return True

        result = self.runner.run_test("Weight Listing", test, "Weights listed")
        self.runner.add_result(result)
        return result.passed

    def test_meal_entry(self) -> bool:
        """Test: Add meal entry"""
        def test():
            today = datetime.now().strftime('%Y-%m-%d')
            result = self.adapter.post('/api/health/meals', {
                'date': today,
                'meal_type': 'lunch',
                'foods': [
                    {'name': 'Salade', 'calories': 150, 'protein': 5},
                    {'name': 'Poulet', 'calories': 250, 'protein': 30}
                ]
            })

            self.runner.assert_true(
                result.get("success") or result.get("id"),
                "Meal should be created"
            )
            return True

        result = self.runner.run_test("Meal Entry", test, "Meal recorded")
        self.runner.add_result(result)
        return result.passed

    def test_meal_listing(self) -> bool:
        """Test: List meals"""
        def test():
            today = datetime.now().strftime('%Y-%m-%d')
            result = self.adapter.get('/api/health/meals', {'date': today})

            self.runner.assert_true(
                "meals" in result or result.get("success"),
                "Should return meals list"
            )
            return True

        result = self.runner.run_test("Meal Listing", test, "Meals listed")
        self.runner.add_result(result)
        return result.passed

    def test_hydration(self) -> bool:
        """Test: Add and get hydration"""
        def test():
            # Add water
            add_result = self.adapter.post('/api/health/hydration', {
                'amount_ml': 250
            })
            self.runner.assert_true(
                add_result.get("success") or add_result.get("id"),
                "Hydration should be added"
            )

            # Get daily total
            get_result = self.adapter.get('/api/health/hydration')
            self.runner.assert_true(
                "hydration" in get_result or get_result.get("success"),
                "Should return hydration data"
            )
            return True

        result = self.runner.run_test("Hydration Tracking", test, "Hydration tracked")
        self.runner.add_result(result)
        return result.passed

    def test_dashboard(self) -> bool:
        """Test: Get health dashboard"""
        def test():
            result = self.adapter.get('/api/health/dashboard')

            self.runner.assert_true(
                result.get("success") or "weight" in result or "nutrition" in result,
                "Should return dashboard data"
            )
            return True

        result = self.runner.run_test("Health Dashboard", test, "Dashboard retrieved")
        self.runner.add_result(result)
        return result.passed

    def test_daily_workflow(self) -> bool:
        """Test: Complete daily health workflow"""
        def test():
            today = datetime.now().strftime('%Y-%m-%d')

            # 1. Morning weigh-in
            weight = self.adapter.post('/api/health/weight', {
                'date': today,
                'weight': 74.8,
                'source': 'test'
            })
            self.runner.assert_true(
                weight.get("success") or weight.get("id"),
                "Morning weigh-in should work"
            )

            # 2. Breakfast
            breakfast = self.adapter.post('/api/health/meals', {
                'date': today,
                'meal_type': 'breakfast',
                'foods': [
                    {'name': 'Oeufs', 'calories': 180, 'protein': 12},
                    {'name': 'Pain complet', 'calories': 120, 'protein': 4}
                ]
            })
            self.runner.assert_true(
                breakfast.get("success") or breakfast.get("id"),
                "Breakfast should be logged"
            )

            # 3. Morning water
            water1 = self.adapter.post('/api/health/hydration', {'amount_ml': 500})
            self.runner.assert_true(water1.get("success") or water1.get("id"), "Water 1")

            # 4. Lunch
            lunch = self.adapter.post('/api/health/meals', {
                'date': today,
                'meal_type': 'lunch',
                'foods': [
                    {'name': 'Riz', 'calories': 200, 'protein': 4},
                    {'name': 'Legumes', 'calories': 80, 'protein': 3},
                    {'name': 'Poisson', 'calories': 220, 'protein': 28}
                ]
            })
            self.runner.assert_true(
                lunch.get("success") or lunch.get("id"),
                "Lunch should be logged"
            )

            # 5. Afternoon water
            water2 = self.adapter.post('/api/health/hydration', {'amount_ml': 750})
            self.runner.assert_true(water2.get("success") or water2.get("id"), "Water 2")

            # 6. Check dashboard
            dashboard = self.adapter.get('/api/health/dashboard')
            self.runner.assert_true(
                dashboard.get("success") or "weight" in dashboard,
                "Dashboard should show daily summary"
            )

            return True

        result = self.runner.run_test("Daily Health Workflow", test, "Full day logged")
        self.runner.add_result(result)
        return result.passed
