import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from api.models import User


class Command(BaseCommand):
    help = 'Create an admin account in both Supabase and the Django database.'

    def add_arguments(self, parser):
        parser.add_argument('--email',    required=True,  help='Admin email address')
        parser.add_argument('--password', required=True,  help='Admin password (min 6 chars)')
        parser.add_argument('--name',     default='Admin', help='Full name (default: Admin)')

    def handle(self, *args, **options):
        email    = options['email']
        password = options['password']
        name     = options['name']

        self.stdout.write(f'\nCreating admin account for {email} ...\n')

        # ── 1. Create in Supabase Auth via admin API ──────────────────────────
        resp = requests.post(
            f"{settings.SUPABASE_URL}/auth/v1/admin/users",
            headers={
                'apikey':         settings.SUPABASE_SERVICE_KEY,
                'Authorization':  f'Bearer {settings.SUPABASE_SERVICE_KEY}',
                'Content-Type':   'application/json',
            },
            json={
                'email':            email,
                'password':         password,
                'email_confirm':    True,   # skip email verification
                'user_metadata':    {'full_name': name},
            },
            timeout=15,
        )

        if resp.status_code not in (200, 201):
            self.stderr.write(self.style.ERROR(
                f'Supabase error ({resp.status_code}): {resp.text}'
            ))
            return

        supabase_user = resp.json()
        user_id = supabase_user.get('id')
        self.stdout.write(f'  ✔ Supabase user created  (id: {user_id})')

        # ── 2. Create in Django DB ────────────────────────────────────────────
        user, created = User.objects.get_or_create(
            id=user_id,
            defaults={
                'email':     email,
                'full_name': name,
                'phone':     '',
                'role':      'admin',
            }
        )

        if not created:
            # User already existed — just promote to admin
            user.role = 'admin'
            user.save()
            self.stdout.write(f'  ✔ Existing Django user promoted to admin')
        else:
            self.stdout.write(f'  ✔ Django user created as admin')

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Admin account ready!\n'
            f'   Email:    {email}\n'
            f'   Password: {password}\n'
            f'   Login at: http://localhost:5173/login\n'
        ))
