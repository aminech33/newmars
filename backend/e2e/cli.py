#!/usr/bin/env python3
"""
E2E Framework CLI - User simulation and stress testing.

Usage:
    python -m e2e --user human              # Full simulation (all modules)
    python -m e2e --user human --learning   # Learning only
    python -m e2e --calibrate               # Calibration mode (test all profiles)
    python -m e2e --calibrate --strict      # Strict calibration (tighter ranges)
    python -m e2e --edge-cases              # Edge-case stress tests
    python -m e2e --stress --days 14        # Full stress test (edge + strict cal)
"""

import argparse
import json
import sys
from datetime import datetime

from .base import E2ERunner, TestConfig, TestMode
from .autonomous_user import (
    AutonomousUser, PROFILES, CALIBRATION_TARGETS,
    get_calibration_targets, print_user_report
)


def run_edge_case_tests(runner, args):
    """
    Run edge-case tests to stress-test the system.

    Tests:
    1. Empty topics list
    2. Single topic only
    3. Very short session (1 day)
    4. Interruption recovery
    5. Engine error handling
    """
    print("\n" + "=" * 70)
    print(" EDGE-CASE TESTS - Stress Testing")
    print("=" * 70)

    results = {}
    all_passed = True

    # Test 1: Empty topics
    print("\n [1/5] Empty topics list...")
    try:
        user = AutonomousUser("human")
        stats = user.live_week(runner.adapter, days=1, topics=[], modules=["learning"], verbose=False)
        # Should handle gracefully (no crash, 0 questions)
        if stats.get("questions", 0) == 0:
            print("   [PASS] Handled empty topics gracefully")
            results["empty_topics"] = {"pass": True}
        else:
            print("   [FAIL] Should have 0 questions with no topics")
            results["empty_topics"] = {"pass": False, "error": "Questions answered without topics"}
            all_passed = False
    except Exception as e:
        # Acceptable if it raises a clear error
        if "topic" in str(e).lower() or "empty" in str(e).lower():
            print(f"   [PASS] Clear error for empty topics: {e}")
            results["empty_topics"] = {"pass": True, "error": str(e)}
        else:
            print(f"   [FAIL] Unexpected error: {e}")
            results["empty_topics"] = {"pass": False, "error": str(e)}
            all_passed = False
    finally:
        user.cleanup(runner.adapter)

    # Test 2: Single topic
    print("\n [2/5] Single topic only...")
    try:
        user = AutonomousUser("motivated")
        stats = user.live_week(
            runner.adapter, days=3,
            topics=["conjugaison"],  # Only one topic
            modules=["learning"], verbose=False
        )
        if stats.get("questions", 0) > 0 and stats.get("accuracy", 0) > 0:
            print(f"   [PASS] Single topic works: {stats['questions']} questions, {stats['accuracy']:.0%} accuracy")
            results["single_topic"] = {"pass": True}
        else:
            print("   [FAIL] No learning with single topic")
            results["single_topic"] = {"pass": False}
            all_passed = False
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
        results["single_topic"] = {"pass": False, "error": str(e)}
        all_passed = False
    finally:
        user.cleanup(runner.adapter)

    # Test 3: Very short session (1 day)
    print("\n [3/5] Minimum session (1 day)...")
    try:
        user = AutonomousUser("expert")
        stats = user.live_week(runner.adapter, days=1, modules=["learning"], verbose=False)
        if stats.get("days_simulated") == 1:
            print(f"   [PASS] 1-day session: {stats['questions']} questions, {stats['xp']} XP")
            results["min_session"] = {"pass": True}
        else:
            print(f"   [FAIL] Expected 1 day, got {stats.get('days_simulated')}")
            results["min_session"] = {"pass": False}
            all_passed = False
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
        results["min_session"] = {"pass": False, "error": str(e)}
        all_passed = False
    finally:
        user.cleanup(runner.adapter)

    # Test 4: Profile extremes (struggling vs expert)
    print("\n [4/5] Profile extremes comparison...")
    try:
        expert = AutonomousUser("expert")
        struggling = AutonomousUser("struggling")

        expert_stats = expert.live_week(runner.adapter, days=3, modules=["learning"], verbose=False)
        expert.cleanup(runner.adapter)

        struggling_stats = struggling.live_week(runner.adapter, days=3, modules=["learning"], verbose=False)
        struggling.cleanup(runner.adapter)

        # Expert should outperform struggling
        expert_better = (
            expert_stats.get("accuracy", 0) > struggling_stats.get("accuracy", 0) and
            expert_stats.get("xp", 0) > struggling_stats.get("xp", 0)
        )
        if expert_better:
            print(f"   [PASS] Expert ({expert_stats['accuracy']:.0%}) > Struggling ({struggling_stats['accuracy']:.0%})")
            results["profile_extremes"] = {"pass": True}
        else:
            print(f"   [FAIL] Expert should outperform struggling")
            results["profile_extremes"] = {"pass": False}
            all_passed = False
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
        results["profile_extremes"] = {"pass": False, "error": str(e)}
        all_passed = False

    # Test 5: All modules together
    print("\n [5/5] All modules integration...")
    try:
        user = AutonomousUser("human")
        stats = user.live_week(
            runner.adapter, days=2,
            modules=["learning", "tasks", "health"],
            verbose=False
        )
        has_learning = stats.get("questions", 0) > 0
        has_tasks = stats.get("tasks_created", 0) > 0
        has_health = stats.get("water_ml", 0) > 0

        if has_learning and has_tasks and has_health:
            print(f"   [PASS] All modules active: {stats['questions']}q, {stats['tasks_created']}t, {stats['water_ml']}ml")
            results["all_modules"] = {"pass": True}
        else:
            missing = []
            if not has_learning: missing.append("learning")
            if not has_tasks: missing.append("tasks")
            if not has_health: missing.append("health")
            print(f"   [FAIL] Missing: {', '.join(missing)}")
            results["all_modules"] = {"pass": False, "missing": missing}
            all_passed = False
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
        results["all_modules"] = {"pass": False, "error": str(e)}
        all_passed = False
    finally:
        user.cleanup(runner.adapter)

    # Summary
    print("\n" + "=" * 70)
    print(" EDGE-CASE SUMMARY")
    print("=" * 70)
    passed = sum(1 for r in results.values() if r.get("pass"))
    print(f"   Tests: {passed}/{len(results)} passed")
    print(f"   Status: {'ALL PASSED' if all_passed else 'SOME FAILED'}")
    print("=" * 70 + "\n")

    if args.json:
        print(json.dumps(results, indent=2, default=str))

    return 0 if all_passed else 1


def run_calibration(runner, args):
    """
    Run calibration mode: test all profiles against expected targets.

    This is the key feature for perfectly calibrating the learning engine.
    """
    # Get targets adjusted for duration and strictness
    targets = get_calibration_targets(days=args.days, strict=args.strict)
    mode_str = "STRICT" if args.strict else "NORMAL"

    print("\n" + "=" * 70)
    print(f" CALIBRATION MODE [{mode_str}] - Testing Learning Engine")
    print("=" * 70)
    print(f"   Duration: {args.days} days per profile")
    print(f"   Profiles: {len(targets)} to test")
    print(f"   Mode: {mode_str} (ranges {'tight' if args.strict else 'normal'})")
    print("-" * 70)

    results = {}
    all_passed = True

    for profile_name in targets.keys():
        print(f"\n Testing {profile_name.upper()}...")

        user = AutonomousUser(profile_name)
        try:
            stats = user.live_week(
                runner.adapter,
                days=args.days,
                modules=["learning"],  # Calibration focuses on learning
                verbose=not args.quiet
            )

            # Check against calibration targets
            target = targets[profile_name]
            check_results = target.check(stats, args.days)
            results[profile_name] = {
                "stats": stats,
                "calibration": check_results
            }

            # Print results
            passed = check_results["all_pass"]
            status = "PASS" if passed else "FAIL"
            print(f"\n   [{status}] {profile_name.upper()}")

            for metric, data in check_results.items():
                if metric == "all_pass":
                    continue
                icon = "✓" if data["pass"] else "✗"
                value = data["value"]
                # Format value - mastery, accuracy, attendance are 0-1 values
                if metric in ("mastery", "accuracy", "attendance"):
                    value_str = f"{value:.1%}"
                else:
                    value_str = f"{value:.1f}"
                print(f"      {icon} {metric}: {value_str} (target: {data['target']})")

            if not passed:
                all_passed = False

        except Exception as e:
            print(f"   [ERROR] {profile_name}: {e}")
            results[profile_name] = {"error": str(e)}
            all_passed = False

        finally:
            user.cleanup(runner.adapter)

    # Final summary
    print("\n" + "=" * 70)
    print(" CALIBRATION SUMMARY")
    print("=" * 70)

    passed_count = sum(1 for r in results.values() if r.get("calibration", {}).get("all_pass"))
    total_count = len(targets)

    print(f"   Profiles: {passed_count}/{total_count} passed")
    print(f"   Status: {'ALL CALIBRATED' if all_passed else 'NEEDS ADJUSTMENT'}")

    if not all_passed:
        print("\n   Failed profiles:")
        for name, data in results.items():
            if not data.get("calibration", {}).get("all_pass"):
                failed_metrics = [
                    k for k, v in data.get("calibration", {}).items()
                    if isinstance(v, dict) and not v.get("pass")
                ]
                print(f"     - {name}: {', '.join(failed_metrics)}")

    print("=" * 70 + "\n")

    if args.json:
        # Clean results for JSON (remove non-serializable objects)
        clean_results = {}
        for name, data in results.items():
            if "error" in data:
                clean_results[name] = data
            else:
                clean_results[name] = {
                    "calibration": data.get("calibration"),
                    "stats": {
                        k: v for k, v in data.get("stats", {}).items()
                        if k in ["accuracy", "xp", "attendance_rate", "mastery", "questions"]
                    }
                }
        print(json.dumps(clean_results, indent=2, default=str))

    return 0 if all_passed else 1


def main():
    parser = argparse.ArgumentParser(
        description="E2E User Simulator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m e2e --user human              Full simulation (learning + tasks + health)
  python -m e2e --user human --learning   Learning module only
  python -m e2e --user motivated --days 7 Motivated user for 7 days
  python -m e2e --discover                List all API routes

Profiles: human (default), motivated, average, irregular, struggling, expert
        """
    )

    parser.add_argument(
        "--user", "-u",
        choices=list(PROFILES.keys()),
        default="human",
        help="User profile to simulate (default: human)"
    )

    parser.add_argument(
        "--days", "-d",
        type=int,
        default=7,
        help="Number of days to simulate (default: 7)"
    )

    parser.add_argument(
        "--learning", "-l",
        action="store_true",
        help="Simulate learning module only"
    )

    parser.add_argument(
        "--tasks", "-t",
        action="store_true",
        help="Simulate tasks module only"
    )

    parser.add_argument(
        "--health",
        action="store_true",
        help="Simulate health module only"
    )

    parser.add_argument(
        "--mode", "-m",
        choices=["direct", "api"],
        default="direct",
        help="Test mode: direct (Python) or api (HTTP)"
    )

    parser.add_argument(
        "--api-url",
        default="http://localhost:8000",
        help="API URL for HTTP mode"
    )

    parser.add_argument(
        "--discover",
        action="store_true",
        help="Discover and list all API routes"
    )

    parser.add_argument(
        "--calibrate",
        action="store_true",
        help="Calibration mode: test all profiles against expected targets"
    )

    parser.add_argument(
        "--strict",
        action="store_true",
        help="Strict calibration mode: tighter ranges for regression detection"
    )

    parser.add_argument(
        "--edge-cases",
        action="store_true",
        help="Run edge-case stress tests (empty topics, extremes, etc.)"
    )

    parser.add_argument(
        "--stress",
        action="store_true",
        help="Full stress test: calibration (strict) + edge-cases"
    )

    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Quiet output (only summary)"
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON"
    )

    parser.add_argument(
        "--with-ai",
        action="store_true",
        help="Full AI integration: generate real questions and simulate answers"
    )

    args = parser.parse_args()

    # Determine modules to simulate
    modules = []
    if args.learning:
        modules.append("learning")
    if args.tasks:
        modules.append("tasks")
    if args.health:
        modules.append("health")
    # If no specific module selected, simulate all
    if not modules:
        modules = ["learning", "tasks", "health"]

    # Build config
    config = TestConfig(
        mode=TestMode.API if args.mode == "api" else TestMode.DIRECT,
        api_url=args.api_url,
        verbose=not args.quiet,
        num_days=args.days,
    )

    # Pass AI mode flag
    use_ai = getattr(args, 'with_ai', False)

    runner = E2ERunner(config)

    # Route discovery
    if args.discover:
        print("\n Discovering API routes...\n")
        routes = runner.adapter.discover_routes()

        if args.json:
            print(json.dumps(routes, indent=2))
        else:
            print(f"Found {len(routes)} routes:\n")
            current_tag = None
            for route in sorted(routes, key=lambda r: (r.get("tags", [""])[0], r.get("path", ""))):
                tag = route.get("tags", ["other"])[0] if route.get("tags") else "other"
                if tag != current_tag:
                    current_tag = tag
                    print(f"\n[{tag.upper()}]")
                print(f"  {route.get('method', '?'):<7} {route.get('path', '?')}")
        return 0

    # Full stress test mode
    if args.stress:
        print("\n" + "=" * 70)
        print(" FULL STRESS TEST")
        print("=" * 70)
        args.strict = True  # Force strict mode

        # Run edge-cases first
        print("\n Phase 1: Edge-case tests\n")
        edge_result = run_edge_case_tests(runner, args)

        # Then run strict calibration
        print("\n Phase 2: Strict calibration\n")
        cal_result = run_calibration(runner, args)

        # Summary
        print("\n" + "=" * 70)
        print(" STRESS TEST COMPLETE")
        print("=" * 70)
        all_pass = edge_result == 0 and cal_result == 0
        print(f"   Edge-cases: {'PASS' if edge_result == 0 else 'FAIL'}")
        print(f"   Calibration: {'PASS' if cal_result == 0 else 'FAIL'}")
        print(f"   Overall: {'ALL SYSTEMS GO' if all_pass else 'ISSUES DETECTED'}")
        print("=" * 70 + "\n")
        return 0 if all_pass else 1

    # Edge-case tests
    if getattr(args, 'edge_cases', False):
        return run_edge_case_tests(runner, args)

    # Calibration mode
    if args.calibrate:
        return run_calibration(runner, args)

    # Run simulation
    modules_str = " + ".join(modules)
    ai_str = " [AI MODE]" if use_ai else ""
    print(f"\n SIMULATION - {args.user.upper()} profile{ai_str}")
    print(f"   Duration: {args.days} days")
    print(f"   Modules: {modules_str}")
    if use_ai:
        print(f"   AI: Real question generation enabled")
    print("-" * 50)

    user = AutonomousUser(args.user, use_ai=use_ai)

    try:
        stats = user.live_week(
            runner.adapter,
            days=args.days,
            topics=config.topics,
            modules=modules,
            verbose=config.verbose
        )

        if args.json:
            print(json.dumps(stats, indent=2, default=str))
        else:
            print_user_report(stats, modules)

        return 0

    except KeyboardInterrupt:
        print("\n\n Simulation interrupted")
        return 130

    except Exception as e:
        print(f"\n Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    finally:
        user.cleanup(runner.adapter)


if __name__ == "__main__":
    sys.exit(main())
