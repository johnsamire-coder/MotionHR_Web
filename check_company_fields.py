import os, sys
sys.path.insert(0, '/var/www/motionhr')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from companies.models import Company
fields = [f.name for f in Company._meta.get_fields()]
print("=== COMPANY MODEL FIELDS ===")
print(fields)
