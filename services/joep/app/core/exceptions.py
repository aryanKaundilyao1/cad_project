class JoepBaseException(Exception):
    def __init__(self, message: str, error_code: str, details: dict = None, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.status_code = status_code

class JoepValidationError(JoepBaseException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "VALIDATION_ERROR", details, 400)

class ConfigurationError(JoepBaseException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "CONFIGURATION_ERROR", details, 500)

class MissingRequiredEvidenceError(JoepBaseException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "MISSING_EVIDENCE_ERROR", details, 400)

class EntityResolutionError(JoepBaseException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "ENTITY_RESOLUTION_ERROR", details, 400)

class ScoringNotImplementedError(JoepBaseException):
    def __init__(self, message: str = "Scoring engine math not implemented in this sprint.", details: dict = None):
        super().__init__(message, "SCORING_ENGINE_NOT_IMPLEMENTED", details, 501)
