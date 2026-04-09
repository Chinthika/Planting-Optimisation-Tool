from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domains.reporting import FarmReportContract, FarmReportMetadata, RecommendationReportEntry
from src.models.farm import Farm
from src.models.recommendations import Recommendation


async def get_farm_report(db: AsyncSession, farm_id: int) -> FarmReportContract | None:
    """Retrieves a farm and its saved recommendations, assembled into a structured report.
    Returns None if the farm does not exist.
    """
    # Get the farm with soil_texture relationship loaded
    farm_result = await db.execute(select(Farm).options(selectinload(Farm.soil_texture)).where(Farm.id == farm_id))
    farm = farm_result.scalar_one_or_none()

    if farm is None:
        return None

    # Get saved recommendations for this farm (exclude excluded species where rank=-1)
    recs_result = await db.execute(
        select(Recommendation).options(selectinload(Recommendation.species)).where(Recommendation.farm_id == farm_id).where(Recommendation.rank_overall >= 0).order_by(Recommendation.rank_overall)
    )
    recommendations = list(recs_result.scalars().all())

    return _assemble_report(farm, recommendations)


async def get_all_farms_report(db: AsyncSession, user_id: int | None = None) -> list[FarmReportContract]:
    """Retrieves all farms and their saved recommendations as a list of reports.
    If user_id is provided, only farms belonging to that user are included.
    """
    farm_stmt = select(Farm).options(selectinload(Farm.soil_texture))
    if user_id is not None:
        farm_stmt = farm_stmt.where(Farm.user_id == user_id)

    farm_result = await db.execute(farm_stmt)
    farms = list(farm_result.scalars().all())

    reports = []
    for farm in farms:
        recs_result = await db.execute(
            select(Recommendation).options(selectinload(Recommendation.species)).where(Recommendation.farm_id == farm.id).where(Recommendation.rank_overall >= 0).order_by(Recommendation.rank_overall)
        )
        recommendations = list(recs_result.scalars().all())
        reports.append(_assemble_report(farm, recommendations))

    return reports


def _assemble_report(farm, recommendations) -> FarmReportContract:
    """Assembles a FarmReportContract from ORM objects."""
    farm_metadata = FarmReportMetadata(
        id=farm.id,
        user_id=farm.user_id,
        rainfall_mm=farm.rainfall_mm,
        temperature_celsius=farm.temperature_celsius,
        elevation_m=farm.elevation_m,
        ph=farm.ph,
        soil_texture=farm.soil_texture.name,
        area_ha=farm.area_ha,
        latitude=farm.latitude,
        longitude=farm.longitude,
    )

    recs = [
        RecommendationReportEntry(
            species_id=r.species_id,
            species_name=r.species.name,
            species_common_name=r.species.common_name,
            rank_overall=r.rank_overall,
            score_mcda=r.score_mcda,
            key_reasons=r.key_reasons,
        )
        for r in recommendations
    ]

    return FarmReportContract(
        farm=farm_metadata,
        recommendations=recs,
        generated_at=datetime.now(timezone.utc),
    )
