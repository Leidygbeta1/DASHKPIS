from copy import deepcopy

PANEL_IDS = (
    'stats',
    'kpiByType',
    'tasksStatus',
    'progressByProject',
    'kpiTrend',
)

LAYOUT_PRESETS = {
    'grid-2': {
        'panels': [
            {'id': 'stats', 'order': 0, 'colSpan': 12},
            {'id': 'kpiByType', 'order': 1, 'colSpan': 6},
            {'id': 'tasksStatus', 'order': 2, 'colSpan': 6},
            {'id': 'progressByProject', 'order': 3, 'colSpan': 12},
            {'id': 'kpiTrend', 'order': 4, 'colSpan': 12},
        ]
    },
    'grid-3': {
        'panels': [
            {'id': 'stats', 'order': 0, 'colSpan': 12},
            {'id': 'kpiByType', 'order': 1, 'colSpan': 4},
            {'id': 'tasksStatus', 'order': 2, 'colSpan': 4},
            {'id': 'kpiTrend', 'order': 3, 'colSpan': 4},
            {'id': 'progressByProject', 'order': 4, 'colSpan': 12},
        ]
    },
    'focus-kpi': {
        'panels': [
            {'id': 'stats', 'order': 0, 'colSpan': 12},
            {'id': 'kpiByType', 'order': 1, 'colSpan': 8},
            {'id': 'tasksStatus', 'order': 2, 'colSpan': 4},
            {'id': 'progressByProject', 'order': 3, 'colSpan': 12},
            {'id': 'kpiTrend', 'order': 4, 'colSpan': 12},
        ]
    },
    'progress-focus': {
        'panels': [
            {'id': 'stats', 'order': 0, 'colSpan': 12},
            {'id': 'progressByProject', 'order': 1, 'colSpan': 12},
            {'id': 'tasksStatus', 'order': 2, 'colSpan': 6},
            {'id': 'kpiByType', 'order': 3, 'colSpan': 6},
            {'id': 'kpiTrend', 'order': 4, 'colSpan': 12},
        ]
    },
    'custom': {
        'panels': [
            {'id': 'stats', 'order': 0, 'colSpan': 12},
            {'id': 'kpiByType', 'order': 1, 'colSpan': 6},
            {'id': 'tasksStatus', 'order': 2, 'colSpan': 6},
            {'id': 'progressByProject', 'order': 3, 'colSpan': 12},
            {'id': 'kpiTrend', 'order': 4, 'colSpan': 12},
        ]
    },
}

DEFAULT_LAYOUT_CODE = 'grid-2'
DEFAULT_PANEL_STATE = deepcopy(LAYOUT_PRESETS[DEFAULT_LAYOUT_CODE])


def safe_default_panel_state():
    """Return a copy so callers can mutate without touching the module constant."""
    return deepcopy(DEFAULT_PANEL_STATE)
