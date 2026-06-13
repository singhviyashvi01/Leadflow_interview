"""
LeadFlow CRM - Sample Data Seeder (v2)
Generates a rich, realistic dataset with historical spread across 12 months
so Reports, Dashboard, and Team Overview screens are fully populated.
"""

import random
from datetime import timedelta, date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import connection

from leads.models import (
    Role, Team, User, LeadSource,
    Lead, FollowUp, PipelineStage, Deal, Invoice,
    Payment, CalendarEvent, Notification, Report
)
from reports.models import Target


# ─── REALISTIC DATA POOLS ─────────────────────────────────────────────────────

FIRST_NAMES = [
    "Arjun", "Priya", "Rahul", "Sneha", "Vikram", "Anjali", "Rohan", "Meera",
    "Karan", "Divya", "Aditya", "Pooja", "Nikhil", "Kavya", "Siddharth", "Riya",
]

LAST_NAMES = [
    "Sharma", "Patel", "Singh", "Kumar", "Mehta", "Verma", "Gupta", "Joshi",
    "Williams", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore",
]

COMPANIES = [
    "TechNova Solutions", "CloudBridge Systems", "DataPulse Analytics",
    "Nexus Innovations", "Apex Digital", "Synergy Corp", "Velocity Ventures",
    "Quantum Leap Tech", "BlueSky Enterprises", "Phoenix Digital Labs",
    "Orbit Systems", "Cascade Technologies", "Frontier Analytics",
    "Momentum Capital", "Horizon Consultancy", "Summit Software",
    "Elevation Partners", "Catalyst Dynamics", "Meridian Group",
    "Zenith Platforms", "Atlas Innovations", "Pinnacle Tech",
    "Groundwork Studios", "Blueprint Consulting", "Acme Global Ltd",
    "TechSphere Inc", "Nova Systems", "Summit Corp",
]

DEAL_TITLES = [
    "Enterprise CRM License", "Annual SaaS Subscription", "Platform Migration",
    "Data Analytics Suite", "Cloud Infrastructure Setup", "Custom Integration",
    "Security Audit & Compliance", "AI Chatbot Implementation", "Mobile App Dev",
    "ERP System Upgrade", "Team Training Package", "API Development",
    "Marketing Automation", "DevOps Pipeline Setup", "BI Dashboard Build",
    "E-commerce Platform", "Customer Portal", "Inventory Management System",
]

TASK_TITLES = [
    "Follow up with client on proposal", "Prepare demo slides", "Send contract draft",
    "Update CRM pipeline", "Schedule discovery call", "Review competitor analysis",
    "Draft email sequence", "Analyze deal metrics", "Submit weekly report",
    "Onboard new team member", "Update lead scoring rules", "Review invoices",
    "Prepare quarterly review", "Call back hot lead", "Send product brochure",
]

EVENT_TITLES = [
    "Product Demo - {company}", "Discovery Call with {name}", "Contract Review",
    "Kickoff Meeting - {company}", "Follow-up Call", "Proposal Presentation",
    "Technical Assessment", "Executive Check-in", "Quarterly Business Review",
    "Onboarding Session", "Strategy Planning",
]

NOTES = [
    "Very interested in the premium tier. Needs board approval.",
    "Requested a detailed proposal by end of week.",
    "Budget confirmed. Decision by Q3.",
    "Has existing contract with competitor — price is key.",
    "Warm lead via LinkedIn. Highly engaged during demo.",
    "Needs customization for compliance requirements.",
    "Fast decision-maker. Follow up Monday.",
    "Technical team loves the integration options.",
    "Referred by Priya Sharma. High trust already established.",
    "CFO wants ROI analysis before sign-off.",
]

PAYMENT_METHODS = ["Credit Card", "Bank Transfer", "UPI", "Stripe", "PayPal", "NEFT"]


def months_ago(n, now=None):
    """Return a timezone-aware datetime approx n months ago."""
    if now is None:
        now = timezone.now()
    return now - timedelta(days=n * 30)


def rand_dt_in_month(year, month):
    """Return a random timezone-aware datetime within the given year/month."""
    import calendar as cal
    last_day = cal.monthrange(year, month)[1]
    d = date(year, month, random.randint(1, last_day))
    naive = timezone.datetime(d.year, d.month, d.day,
                              random.randint(8, 18), random.randint(0, 59))
    return timezone.make_aware(naive)


def force_created_at(obj, dt):
    """Bypass auto_now_add and set created_at directly via SQL."""
    table = obj.__class__._meta.db_table
    pk_col = obj.__class__._meta.pk.column
    with connection.cursor() as cursor:
        cursor.execute(
            f'UPDATE "{table}" SET "created_at" = %s WHERE "{pk_col}" = %s',
            [dt, obj.pk]
        )


class Command(BaseCommand):
    help = "🌱 Seeds LeadFlow with a rich 12-month realistic sample dataset"

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear', action='store_true',
            help='Clear existing data before seeding'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("\n🚀 LeadFlow Sample Data Seeder v2 Starting...\n"))

        if options['clear']:
            self._clear_data()

        roles = self._create_roles()
        teams = self._create_teams()
        users = self._create_users(roles, teams)
        sources = self._create_sources()
        stages = self._create_pipeline_stages()
        leads = self._create_leads(sources, users, teams)
        self._create_followups(leads, users)
        deals = self._create_deals(leads, stages)
        invoices = self._create_invoices(deals)
        self._create_payments(invoices)
        self._create_targets(users)
        self._create_calendar_events(users, leads, deals)
        self._create_notifications(users)
        self._create_reports(users)
        self._create_tasks(users)

        self.stdout.write(self.style.SUCCESS("\n✅ Sample data seeded successfully!\n"))
        self.stdout.write(self.style.HTTP_INFO("📊 Summary:"))
        self.stdout.write(f"   👥 Users:      {User.objects.count()}")
        self.stdout.write(f"   🎯 Leads:      {Lead.objects.count()}")
        self.stdout.write(f"   💼 Deals:      {Deal.objects.count()}")
        self.stdout.write(f"   🧾 Invoices:   {Invoice.objects.count()}")
        self.stdout.write(f"   📅 Events:     {CalendarEvent.objects.count()}")
        self.stdout.write(f"   📌 Follow-ups: {FollowUp.objects.count()}")
        self.stdout.write(f"   🎯 Targets:    {Target.objects.count()}")
        self.stdout.write(f"\n🔑 Login: admin@leadflow.com / Admin@1234\n")

    # ── Clear ──────────────────────────────────────────────────────────────────

    def _clear_data(self):
        self.stdout.write("🧹 Clearing existing data...")
        try:
            from tasks.models import Task
            Task.objects.all().delete()
        except Exception:
            pass
        Target.objects.all().delete()
        Report.objects.all().delete()
        Notification.objects.all().delete()
        CalendarEvent.objects.all().delete()
        Payment.objects.all().delete()
        Invoice.objects.all().delete()
        Deal.objects.all().delete()
        FollowUp.objects.all().delete()
        Lead.objects.all().delete()
        LeadSource.objects.all().delete()
        PipelineStage.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        Team.objects.all().delete()
        Role.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("   Done!\n"))

    # ── Roles ──────────────────────────────────────────────────────────────────

    def _create_roles(self):
        self.stdout.write("🎭 Creating roles...")
        role_data = [
            ("Admin", "Full system access"),
            ("Sales Manager", "Manages team targets and pipeline oversight"),
            ("Sales Rep", "Handles lead generation and deal closure"),
            ("Marketing", "Manages campaigns and lead sources"),
            ("Finance", "Handles invoices, payments, and reporting"),
        ]
        roles = []
        for name, desc in role_data:
            role, _ = Role.objects.get_or_create(name=name, defaults={"description": desc})
            roles.append(role)
        self.stdout.write(self.style.SUCCESS(f"   ✓ {len(roles)} roles created"))
        return {r.name: r for r in roles}

    # ── Teams ──────────────────────────────────────────────────────────────────

    def _create_teams(self):
        self.stdout.write("🏢 Creating teams...")
        team_names = ["Alpha Squad", "Beta Force", "Growth Tigers", "Enterprise Hawks"]
        teams = []
        for name in team_names:
            team, _ = Team.objects.get_or_create(name=name)
            teams.append(team)
        self.stdout.write(self.style.SUCCESS(f"   ✓ {len(teams)} teams created"))
        return teams

    # ── Users ─────────────────────────────────────────────────────────────────

    def _create_users(self, roles, teams):
        self.stdout.write("👥 Creating users...")

        if not User.objects.filter(email="admin@leadflow.com").exists():
            admin = User.objects.create_superuser(
                email="admin@leadflow.com",
                password="Admin@1234",
                first_name="Admin",
                last_name="LeadFlow",
            )
            admin.role = roles["Admin"]
            admin.save()

        user_profiles = [
            ("Arjun", "Sharma", "arjun@leadflow.com", "Sales Manager", teams[0]),
            ("Priya", "Mehta", "priya@leadflow.com", "Sales Rep", teams[0]),
            ("Rahul", "Patel", "rahul@leadflow.com", "Sales Rep", teams[1]),
            ("Sneha", "Verma", "sneha@leadflow.com", "Sales Manager", teams[1]),
            ("Vikram", "Singh", "vikram@leadflow.com", "Sales Rep", teams[2]),
            ("Anjali", "Kumar", "anjali@leadflow.com", "Sales Rep", teams[2]),
            ("Rohan", "Gupta", "rohan@leadflow.com", "Sales Rep", teams[3]),
            ("Meera", "Joshi", "meera@leadflow.com", "Finance", teams[3]),
        ]

        team_users = []
        for first, last, email, role_name, team in user_profiles:
            if not User.objects.filter(email=email).exists():
                u = User.objects.create_user(
                    email=email, password="User@1234",
                    first_name=first, last_name=last,
                )
                u.role = roles[role_name]
                u.team = team
                u.save()
                team_users.append(u)
            else:
                team_users.append(User.objects.get(email=email))

        teams[0].manager = team_users[0]
        teams[1].manager = team_users[3]
        teams[2].manager = team_users[4]
        teams[3].manager = team_users[6]
        for team in teams:
            team.save()

        all_users = list(User.objects.all())
        self.stdout.write(self.style.SUCCESS(f"   ✓ {len(all_users)} users created"))
        return all_users

    # ── Lead Sources ──────────────────────────────────────────────────────────

    def _create_sources(self):
        self.stdout.write("📡 Creating lead sources...")
        sources_data = [
            ("LinkedIn Ads", "q4-linkedin", "linkedin", "cpc"),
            ("Google Search", "google-search-2025", "google", "cpc"),
            ("Referral Program", "referral-jan", "referral", "organic"),
            ("Webinar - Product Demo", "webinar-q1", "webinar", "email"),
            ("Cold Outreach", "cold-email-jan", "email", "outbound"),
            ("Trade Show", "tradeshow-2025", "event", "offline"),
            ("Inbound Website", "", "website", "organic"),
        ]
        sources = []
        for name, campaign, source, medium in sources_data:
            s, _ = LeadSource.objects.get_or_create(
                name=name,
                defaults={"utm_campaign": campaign, "utm_source": source, "utm_medium": medium}
            )
            sources.append(s)
        self.stdout.write(self.style.SUCCESS(f"   ✓ {len(sources)} sources created"))
        return sources

    # ── Pipeline Stages ───────────────────────────────────────────────────────

    def _create_pipeline_stages(self):
        self.stdout.write("🔀 Creating pipeline stages...")
        stages_data = [
            ("Prospecting", 1, 10),
            ("Qualification", 2, 25),
            ("Proposal Sent", 3, 40),
            ("Negotiation", 4, 65),
            ("Contract Review", 5, 80),
            ("Closed Won", 6, 100),
            ("Closed Lost", 7, 0),
        ]
        stages = []
        for name, order, prob in stages_data:
            s, _ = PipelineStage.objects.get_or_create(
                name=name,
                defaults={"order": order, "probability_percent": prob}
            )
            stages.append(s)
        self.stdout.write(self.style.SUCCESS(f"   ✓ {len(stages)} pipeline stages created"))
        return stages

    # ── Leads ─────────────────────────────────────────────────────────────────

    def _create_leads(self, sources, users, teams):
        self.stdout.write("🎯 Creating leads (spread over 12 months)...")

        sales_users = [u for u in users if not u.is_superuser]
        now = timezone.now()
        statuses = ['new', 'contacted', 'qualified', 'lost']
        status_weights = [0.2, 0.35, 0.35, 0.1]

        leads = []
        # Create ~8-10 leads per month across last 12 months
        for month_offset in range(0, 12):
            target_date = now - timedelta(days=month_offset * 30)
            year = target_date.year
            month = target_date.month
            count = random.randint(7, 11)

            for i in range(count):
                first = random.choice(FIRST_NAMES)
                last = random.choice(LAST_NAMES)
                company = random.choice(COMPANIES)
                status = random.choices(statuses, weights=status_weights)[0]
                score = random.randint(20, 98) if status != 'lost' else random.randint(5, 45)
                created_dt = rand_dt_in_month(year, month)
                assigned = random.choice(sales_users)

                lead = Lead(
                    first_name=first,
                    last_name=last,
                    email=f"{first.lower()}.{last.lower()}{month_offset}{i}@{company.lower().replace(' ', '').replace(',', '')[:12]}.com",
                    phone=f"+91-9{random.randint(100000000, 999999999)}",
                    company=company,
                    source=random.choice(sources),
                    assigned_to=assigned,
                    team=random.choice(teams),
                    status=status,
                    score=score,
                )
                lead.save()
                force_created_at(lead, created_dt)
                leads.append(lead)

        self.stdout.write(self.style.SUCCESS(f"   ✓ {len(leads)} leads created"))
        return leads

    # ── Follow-ups ────────────────────────────────────────────────────────────

    def _create_followups(self, leads, users):
        self.stdout.write("📞 Creating follow-ups...")

        sales_users = [u for u in users if not u.is_superuser]
        statuses = ['pending', 'done', 'missed']
        status_weights = [0.25, 0.55, 0.20]
        now = timezone.now()

        count = 0
        for lead in random.sample(leads, min(70, len(leads))):
            n = random.randint(1, 3)
            for _ in range(n):
                offset = random.randint(-60, 20)
                FollowUp.objects.create(
                    lead=lead,
                    user=lead.assigned_to or random.choice(sales_users),
                    followup_date=now + timedelta(days=offset),
                    status=random.choices(statuses, weights=status_weights)[0],
                    notes=random.choice(NOTES),
                    reminder_sent=random.choice([True, False]),
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"   ✓ {count} follow-ups created"))

    # ── Deals ─────────────────────────────────────────────────────────────────

    def _create_deals(self, leads, stages):
        self.stdout.write("💼 Creating deals (spread over 12 months)...")

        now = timezone.now()
        won_stage = next(s for s in stages if 'Won' in s.name)
        lost_stage = next(s for s in stages if 'Lost' in s.name)
        active_stages = [s for s in stages if 'Won' not in s.name and 'Lost' not in s.name]

        lead_sources = ["DIRECT", "PAID", "REFERRAL", "SOCIAL"]
        lead_source_weights = [0.40, 0.28, 0.18, 0.14]
        priorities = ['high', 'medium', 'low']
        priority_weights = [0.25, 0.50, 0.25]

        # Each sales rep gets a somewhat different win rate to show variance
        sales_users = [u for u in User.objects.filter(role__name='Sales Rep')]
        rep_win_rates = {u.pk: random.uniform(0.25, 0.55) for u in sales_users}

        qualified_leads = [l for l in leads if l.status in ('qualified', 'contacted')]
        # Take up to 60 of them
        deal_leads = random.sample(qualified_leads, min(60, len(qualified_leads)))

        deals = []
        for lead in deal_leads:
            # Determine outcome based on rep's win rate
            win_rate = rep_win_rates.get(lead.assigned_to_id, 0.35)
            outcome = random.choices(
                ['won', 'lost', 'active'],
                weights=[win_rate, 0.15, 1 - win_rate - 0.15]
            )[0]

            value = Decimal(str(round(random.uniform(8000, 180000), 2)))

            # Retrieve lead's created_at for temporal consistency
            lead.refresh_from_db()
            lead_created = lead.created_at
            # Deal created 5–30 days after lead
            deal_created = lead_created + timedelta(days=random.randint(5, 30))
            if deal_created > now:
                deal_created = now - timedelta(days=random.randint(1, 10))

            if outcome == 'won':
                stage = won_stage
                is_won, is_lost, result = True, False, 'WON'
            elif outcome == 'lost':
                stage = lost_stage
                is_won, is_lost, result = False, True, 'LOST'
            else:
                stage = random.choice(active_stages)
                is_won, is_lost, result = False, False, None

            deal = Deal(
                lead=lead,
                title=f"{random.choice(DEAL_TITLES)} — {lead.company}",
                deal_value=value,
                priority=random.choices(priorities, weights=priority_weights)[0],
                stage=stage,
                expected_close_date=(now + timedelta(days=random.randint(7, 90))).date(),
                is_won=is_won,
                is_lost=is_lost,
                result=result,
                lead_source=random.choices(lead_sources, weights=lead_source_weights)[0],
            )
            deal.save()
            force_created_at(deal, deal_created)
            deals.append(deal)

        self.stdout.write(self.style.SUCCESS(f"   ✓ {len(deals)} deals created"))
        return deals

    # ── Invoices ──────────────────────────────────────────────────────────────

    def _create_invoices(self, deals):
        self.stdout.write("🧾 Creating invoices (with overdue)...")

        now = timezone.now()
        today = now.date()

        won_deals = [d for d in deals if d.is_won]
        active_deals = [d for d in deals if not d.is_won and not d.is_lost]
        invoice_deals = won_deals + random.sample(active_deals, min(8, len(active_deals)))

        invoices = []

        for i, deal in enumerate(invoice_deals):
            tax = Decimal(str(random.choice([0, 5, 9, 18])))
            discount = Decimal(str(random.choice([0, 5, 10, 15])))
            base = deal.deal_value
            total = base * (1 + tax / 100) * (1 - discount / 100)

            deal.refresh_from_db()
            deal_created = deal.created_at
            # Invoice created 1–10 days after deal
            inv_created = deal_created + timedelta(days=random.randint(1, 10))
            if inv_created > now:
                inv_created = now - timedelta(days=random.randint(1, 5))

            # Due date: 30 days after invoice creation
            due = (inv_created + timedelta(days=30)).date()

            # Status logic: if deal is won and due date passed → high chance PAID or OVERDUE
            if deal.is_won:
                if due < today:
                    status = random.choices(['PAID', 'OVERDUE'], weights=[0.70, 0.30])[0]
                else:
                    status = random.choices(['PAID', 'PENDING'], weights=[0.50, 0.50])[0]
            else:
                status = 'PENDING'

            inv = Invoice(
                deal=deal,
                invoice_number=f"INV-2025-{str(i + 1).zfill(4)}",
                amount=base,
                tax=tax,
                discount=discount,
                total_amount=round(total, 2),
                due_date=due,
                status=status,
            )
            inv.save()
            force_created_at(inv, inv_created)
            invoices.append(inv)

        paid_c = sum(1 for inv in invoices if inv.status == 'PAID')
        overdue_c = sum(1 for inv in invoices if inv.status == 'OVERDUE')
        self.stdout.write(self.style.SUCCESS(
            f"   ✓ {len(invoices)} invoices created ({paid_c} PAID, {overdue_c} OVERDUE)"
        ))
        return invoices

    # ── Payments ──────────────────────────────────────────────────────────────

    def _create_payments(self, invoices):
        self.stdout.write("💳 Creating payments...")

        paid_invoices = [inv for inv in invoices if inv.status == 'PAID']
        count = 0
        now = timezone.now()

        for inv in paid_invoices:
            inv.refresh_from_db()
            is_partial = random.random() < 0.3
            if is_partial:
                Payment.objects.create(
                    invoice=inv,
                    amount_paid=round(inv.total_amount * Decimal("0.5"), 2),
                    payment_method=random.choice(PAYMENT_METHODS),
                    transaction_id=f"TXN-{random.randint(100000, 999999)}",
                    payment_date=inv.created_at + timedelta(days=random.randint(5, 15)),
                    is_partial=True,
                )
                Payment.objects.create(
                    invoice=inv,
                    amount_paid=round(inv.total_amount * Decimal("0.5"), 2),
                    payment_method=random.choice(PAYMENT_METHODS),
                    transaction_id=f"TXN-{random.randint(100000, 999999)}",
                    payment_date=inv.created_at + timedelta(days=random.randint(20, 30)),
                    is_partial=True,
                )
                count += 2
            else:
                Payment.objects.create(
                    invoice=inv,
                    amount_paid=inv.total_amount,
                    payment_method=random.choice(PAYMENT_METHODS),
                    transaction_id=f"TXN-{random.randint(100000, 999999)}",
                    payment_date=inv.created_at + timedelta(days=random.randint(5, 25)),
                    is_partial=False,
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"   ✓ {count} payments created"))

    # ── Targets ───────────────────────────────────────────────────────────────

    def _create_targets(self, users):
        """
        Seed monthly targets for each Sales Manager for the last 6 months.
        Targets are set just above the actual revenue so the goal shows ~65-85%.
        """
        self.stdout.write("🎯 Creating monthly targets...")

        managers = [u for u in users if u.role and u.role.name == 'Sales Manager']
        if not managers:
            self.stdout.write(self.style.WARNING("   ⚠ No managers found, skipping targets."))
            return

        now = timezone.now()
        count = 0

        for manager in managers:
            for month_offset in range(0, 7):
                target_date = now - timedelta(days=month_offset * 30)
                month_start = target_date.replace(day=1).date()

                # Calculate actual paid revenue for that month
                from django.db.models import Sum as DjSum
                actual = Invoice.objects.filter(
                    status='PAID',
                    created_at__year=month_start.year,
                    created_at__month=month_start.month,
                ).aggregate(total=DjSum('amount'))['total'] or Decimal('0')

                # Target = actual revenue * (1.2 to 1.5), floor at 100k
                multiplier = Decimal(str(random.uniform(1.20, 1.50)))
                target_val = max(Decimal('100000'), round(actual * multiplier, 2))

                Target.objects.update_or_create(
                    user=manager,
                    month=month_start,
                    defaults={'target_amount': target_val}
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"   ✓ {count} monthly targets created"))

    # ── Calendar Events ───────────────────────────────────────────────────────

    def _create_calendar_events(self, users, leads, deals):
        self.stdout.write("📅 Creating calendar events...")

        sales_users = [u for u in users if not u.is_superuser]
        event_types = ['call', 'meeting', 'reminder', 'other']
        type_weights = [0.30, 0.45, 0.15, 0.10]
        colors = ['#0e4d46', '#1a7a6e', '#e85d04', '#3a86ff', '#8338ec', '#ff006e']
        now = timezone.now()
        count = 0

        for i in range(45):
            user = random.choice(sales_users)
            lead = random.choice(leads)
            deal = random.choice(deals) if random.random() > 0.4 else None
            event_type = random.choices(event_types, weights=type_weights)[0]

            title_template = random.choice(EVENT_TITLES)
            title = title_template.format(company=lead.company, name=f"{lead.first_name} {lead.last_name}")

            start = now + timedelta(days=random.randint(-15, 35), hours=random.randint(8, 17))
            duration = random.choice([30, 45, 60, 90])
            end = start + timedelta(minutes=duration)

            evt = CalendarEvent.objects.create(
                title=title,
                description=random.choice(NOTES),
                start_time=start,
                end_time=end,
                event_type=event_type,
                location="Google Meet" if event_type == 'meeting' else "",
                meeting_link="https://meet.google.com/abc-defg-hij" if event_type == 'meeting' else "",
                all_day=False,
                user=user,
                lead=lead,
                deal=deal,
                color=random.choice(colors),
                reminders=[{"offset": 15, "method": "email"}, {"offset": 5, "method": "popup"}],
            )
            evt.attendees.set(random.sample(sales_users, min(2, len(sales_users))))
            count += 1

        self.stdout.write(self.style.SUCCESS(f"   ✓ {count} calendar events created"))

    # ── Notifications ─────────────────────────────────────────────────────────

    def _create_notifications(self, users):
        self.stdout.write("🔔 Creating notifications...")

        sales_users = [u for u in users if not u.is_superuser]
        notif_types = ['followup', 'payment', 'assignment', 'discount', 'meeting']
        messages = [
            "You have a follow-up due with Arjun Sharma today.",
            "Invoice INV-2025-0003 has been paid.",
            "New lead assigned to you: TechNova Solutions.",
            "Special discount approved for Quantum Leap Tech deal.",
            "Meeting scheduled: Product Demo - Apex Digital at 3 PM.",
            "Deal moved to Negotiation stage by Priya Mehta.",
            "Follow-up marked as missed.",
            "New invoice created for Cascade Technologies.",
            "Lead score updated to 87 for a lead.",
            "Upcoming meeting in 30 minutes with BlueSky Enterprises.",
            "Contract review scheduled for tomorrow.",
            "New referral lead assigned: Summit Software.",
            "Invoice overdue: TechSphere Inc — ₹8,250.",
            "Deal closed! Nexus Innovations — ₹1,45,000.",
            "Quota 75% achieved this month. Keep it up!",
        ]

        count = 0
        for _ in range(35):
            sender = random.choice(sales_users)
            receiver = random.choice([u for u in sales_users if u != sender])
            Notification.objects.create(
                sender=sender,
                receiver=receiver,
                message=random.choice(messages),
                type=random.choice(notif_types),
                is_read=random.choices([True, False], weights=[0.65, 0.35])[0],
            )
            count += 1

        self.stdout.write(self.style.SUCCESS(f"   ✓ {count} notifications created"))

    # ── Reports ───────────────────────────────────────────────────────────────

    def _create_reports(self, users):
        self.stdout.write("📊 Creating reports...")

        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            admin = users[0]

        reports_data = [
            ("Q1 2025 Revenue Report", "revenue", {"period": "Q1-2025", "team": "all"}),
            ("Monthly Lead Conversion", "leads", {"month": "May", "year": "2025"}),
            ("Sales Team Performance H1", "performance", {"quarter": "H1", "year": "2025"}),
            ("Top Source Analysis", "leads", {"source": "all", "period": "last_90_days"}),
            ("Invoice & Payment Summary", "revenue", {"status": "all", "period": "2025"}),
            ("Q2 2025 Pipeline Report", "performance", {"quarter": "Q2", "year": "2025"}),
        ]

        for name, rtype, filters in reports_data:
            Report.objects.get_or_create(
                name=name,
                defaults={"report_type": rtype, "created_by": admin, "filters": filters}
            )

        self.stdout.write(self.style.SUCCESS(f"   ✓ {len(reports_data)} reports created"))

    # ── Tasks ─────────────────────────────────────────────────────────────────

    def _create_tasks(self, users):
        self.stdout.write("📌 Creating tasks...")

        try:
            from tasks.models import Task
        except ImportError:
            self.stdout.write(self.style.WARNING("   ⚠ Tasks app not found, skipping."))
            return

        sales_users = [u for u in users if not u.is_superuser]
        priorities = ['High', 'Medium', 'Low']
        priority_weights = [0.25, 0.50, 0.25]
        now = timezone.now()
        count = 0

        for user in sales_users:
            for _ in range(random.randint(4, 7)):
                Task.objects.create(
                    title=random.choice(TASK_TITLES),
                    due_date=now + timedelta(days=random.randint(-5, 20)),
                    is_completed=random.choices([True, False], weights=[0.35, 0.65])[0],
                    priority=random.choices(priorities, weights=priority_weights)[0],
                    user=user,
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"   ✓ {count} tasks created"))
