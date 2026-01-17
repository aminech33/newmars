#!/usr/bin/env python3
"""
E2E Framework CLI - Command line interface for running E2E tests.

Usage:
    python -m e2e                          # Run all tests
    python -m e2e --scenario learning      # Run learning tests only
    python -m e2e --scenario tasks         # Run tasks tests only
    python -m e2e --scenario health        # Run health tests only
    python -m e2e --scenario simulation    # Run simulation tests
    python -m e2e --scenario navigation    # Run navigation tests
    python -m e2e --simulate motivated     # Run simulation for specific profile
    python -m e2e --simulate motivated --days 7  # 7-day simulation
    python -m e2e --discover               # Discover all routes
    python -m e2e --mode api               # Use HTTP API mode
"""

import argparse
import json
import sys
from datetime import datetime

from .base import E2ERunner, TestConfig, TestMode
from .simulator import UserSimulator, BEHAVIOR_PROFILES, SimulationReport


def main():
    parser = argparse.ArgumentParser(
        description="E2E Test Framework v4.0",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m e2e                        Run all tests
  python -m e2e --scenario learning    Run learning tests only
  python -m e2e --simulate motivated   Simulate motivated user
  python -m e2e --discover             List all API routes
        """
    )

    parser.add_argument(
        "--scenario", "-s",
        choices=["all", "learning", "tasks", "health", "simulation", "navigation"],
        default="all",
        help="Test scenario to run (default: all)"
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
        "--simulate",
        choices=list(BEHAVIOR_PROFILES.keys()),
        help="Run standalone simulation for a profile"
    )

    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Number of days to simulate (default: 7)"
    )

    parser.add_argument(
        "--discover",
        action="store_true",
        help="Discover and list all API routes"
    )

    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        default=True,
        help="Verbose output"
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
        "--fail-fast",
        action="store_true",
        help="Stop on first failure"
    )

    args = parser.parse_args()

    # Build config
    config = TestConfig(
        mode=TestMode.API if args.mode == "api" else TestMode.DIRECT,
        api_url=args.api_url,
        verbose=not args.quiet and args.verbose,
        fail_fast=args.fail_fast,
        num_days=args.days,
    )

    runner = E2ERunner(config)

    # Route discovery mode
    if args.discover:
        print("\n🔍 Discovering API routes...\n")
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

    # Standalone simulation mode
    if args.simulate:
        print(f"\n🎭 Simulating {args.simulate} user for {args.days} days...\n")

        simulator = UserSimulator(args.simulate)
        user_id = runner.generate_id(f"cli_{args.simulate}")
        runner.cleanup.register_user(user_id)

        try:
            result = simulator.simulate_days(
                runner.adapter,
                user_id,
                config.topics,
                num_days=args.days
            )

            if args.json:
                print(json.dumps(result, indent=2, default=str))
            else:
                print(SimulationReport.daily_breakdown(result))
                print(f"\n✅ Simulation complete!")

            return 0

        finally:
            runner.cleanup.cleanup_all(runner.adapter)

    # Standard test run
    print(f"\n🧪 E2E Framework v4.0 - {args.scenario.upper()} tests")
    print(f"   Mode: {config.mode.value}")
    print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 50)

    try:
        report = runner.run_scenario(args.scenario)

        if args.json:
            print(json.dumps(report.to_dict(), indent=2))
        else:
            report.print_summary()

        # Exit code based on results
        if report.failed > 0:
            return 1
        return 0

    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 130

    except Exception as e:
        print(f"\n❌ Error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1

    finally:
        runner.cleanup.cleanup_all(runner.adapter)


if __name__ == "__main__":
    sys.exit(main())
