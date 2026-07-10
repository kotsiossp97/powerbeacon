from sqlmodel import Session

from powerbeacon.crud import config_crud
from powerbeacon.models import ServiceConfigCreate


def seed_database(session: Session):
    print("Seeding database...")
    create_initial_service_config(session)

    print("Database seeded successfully.")


def create_initial_service_config(session: Session):

    # Settings For Device Reachability Service
    device_status_obj = ServiceConfigCreate(
        service_name="device_reachability",
        config_data={"enabled": True, "interval_seconds": 60, "update_resolved_ip": True},
    )

    # ... Other service configurations can be added here as needed

    config_crud.create_or_update_service_settings(session, device_status_obj, should_update=False)
