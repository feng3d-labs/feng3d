/**
 * English language resources
 */
import { LanguageResources } from '../i18n';

export const en_US: LanguageResources = {
    // Common
    common: {
        ok: 'OK',
        cancel: 'Cancel',
        yes: 'Yes',
        no: 'No',
        close: 'Close',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        remove: 'Remove',
        search: 'Search',
        reset: 'Reset',
        confirm: 'Confirm',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Info',
    },

    // Toolbar
    toolbar: {
        move: 'Move (W)',
        rotate: 'Rotate (E)',
        scale: 'Scale (R)',
        pivotCenter: 'Pivot/Center',
        localWorld: 'Local/World',
        play: 'Play',
        help: 'Help',
        qrcode: 'QR Code',
        settings: 'Settings',
    },

    // View
    view: {
        type: 'Type',
        selectToInspect: 'Select an object to inspect',
        window: 'Window',
        cameraPreview: 'Camera Preview',
    },

    // Terrain
    terrain: {
        brushes: 'Brushes',
        settings: 'Settings',
        brushSize: 'Brush Size',
        opacity: 'Opacity',
        raiseLowerHeight: 'Raise/Lower Height',
        paintHeight: 'Paint Height',
        smoothHeight: 'Smooth Height',
        paintTexture: 'Paint Texture',
        height: 'Height',
        targetStrength: 'Target Strength',
        terrainSettings: 'Terrain Settings',
        openSettings: 'Open Settings',
    },

    // Message
    message: {
        gameSceneNotFound: 'Game scene not found, cannot play',
        cannotOpenRunWindow: 'Cannot open run window, popup may be blocked by browser',
        playFailed: 'Play failed',
    },

    // Settings
    settings: {
        appearance: 'Appearance',
        theme: 'Theme',
        classicTheme: 'Classic Theme',
        dark: 'Dark',
        light: 'Light',
        language: 'Language',
        languageZhCN: '简体中文',
        languageEnUS: 'English',
    },

    // Inspector
    inspector: {
        back: 'Back',
        backToPrevious: 'Back to previous object',
        noObjectSelected: 'No object selected',
    },

    // Panels
    panels: {
        hierarchy: 'Hierarchy',
        scene: 'Scene',
        project: 'Project',
        inspector: 'Inspector',
        console: 'Console',
    },

    // Context Menu
    contextMenu: {
        copy: 'Copy',
        paste: 'Paste',
        duplicate: 'Duplicate',
        delete: 'Delete',
        remove: 'Remove',
        removeComponent: 'Remove Component',
    },

    // Object
    object: {
        name: 'Name',
        visible: 'Visible',
        mouseEnabled: 'Mouse Enabled',
    },

    // Gradient
    gradient: {
        color: 'Color',
        gradient: 'Gradient',
        twoColors: 'Two Colors',
        twoGradients: 'Two Gradients',
        randomColor: 'Random Color',
        unknown: 'Unknown',
    },

    // Shortcut Settings
    shortcut: {
        title: 'Shortcut Settings',
        searchPlaceholder: 'Type to search key bindings',
        key: 'Key',
        command: 'Command',
        stateCommand: 'State Command',
        when: 'When',
        empty: 'No matching shortcuts',
    },

    // Console
    console: {
        clear: 'Clear',
        clearAll: 'Clear Logs',
        autoScroll: 'Auto Scroll',
        filter: 'Filter',
        search: 'Search',
        searchPlaceholder: 'Search logs...',
        all: 'All',
        error: 'Error',
        warning: 'Warning',
        info: 'Log',
        empty: 'No logs',
        noLogs: 'No logs available',
        started: 'Console started',
        showInHierarchy: 'Show in Hierarchy',
        copy: 'Copy',
        copyMessage: 'Copy Message',
    },

    // Animation View
    animation: {
        title: 'Animation',
        noAnimationComponent: 'No object with Animation component selected',
        play: 'Play',
        pause: 'Pause',
        stop: 'Stop',
        begin: 'Begin',
        previous: 'Previous Frame',
        next: 'Next Frame',
        end: 'End',
        record: 'Record',
        currentTime: 'Current Time',
        currentFrame: 'Current Frame',
        fps: 'FPS',
        animationClip: 'Animation Clip',
        noAnimationClip: 'No Animation Clip',
        create: 'Create',
        properties: 'Properties',
        timeline: 'Timeline',
        speed: 'Play Speed',
    },
};
