"""Abstract Base Storage Provider."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class BaseStorageProvider(ABC):
    """Abstract interface for experiment persistence."""

    @abstractmethod
    def save_experiment(self, experiment_data: Dict[str, Any]) -> str:
        """Persist experiment record. Returns experiment ID."""
        pass

    @abstractmethod
    def get_experiment(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        """Fetch single experiment record by ID."""
        pass

    @abstractmethod
    def list_experiments(
        self,
        limit: int = 50,
        modulation: Optional[str] = None,
        channel_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List historical experiments with optional filtering."""
        pass

    @abstractmethod
    def delete_experiment(self, experiment_id: str) -> bool:
        """Delete experiment record."""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Return storage mode, connectivity, and status."""
        pass
