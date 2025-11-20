/**
 * Rendering Constants for PedigreeJS SVG Generation
 *
 * This module centralizes all "magic numbers" used in SVG rendering to improve
 * code maintainability and allow easier customization.
 *
 * @module rendering-constants
 * @version 4.0.0-rc1
 * @date 2025-11-19
 */

/**
 * SVG rendering constants
 * All factors and offsets used in pedigree.js for calculating positions, sizes, and styling
 */
export const RENDERING_CONSTANTS = {
	// ========================================
	// NODE SEPARATION (tree layout)
	// ========================================

	/**
	 * Separation factor for siblings with same parents
	 * Used in D3 tree layout to space nodes horizontally
	 */
	SEPARATION_SAME_PARENT: 1.2,

	/**
	 * Separation factor for siblings with different parents
	 * Larger spacing for half-siblings or nodes from different families
	 */
	SEPARATION_DIFFERENT: 2.2,

	// ========================================
	// SYMBOL SIZING
	// ========================================

	/**
	 * Extra size added to symbol border path
	 * Ensures border is slightly larger than symbol for visual clarity
	 */
	SYMBOL_BORDER_EXTRA: 2,

	/**
	 * Size reduction factor for hidden nodes (1/5th of normal size)
	 * Hidden nodes are structural only, shown in DEBUG mode
	 */
	HIDDEN_NODE_SIZE_FACTOR: 0.2,

	// ========================================
	// ADOPTED BRACKETS (adopted_in/adopted_out)
	// ========================================

	/**
	 * Horizontal offset for bracket start position
	 * Bracket X position = -(symbol_size * this factor)
	 * Value 0.66 positions bracket 2/3 of symbol width from center
	 */
	BRACKET_X_OFFSET_FACTOR: 0.66,

	/**
	 * Vertical offset for bracket start position
	 * Bracket Y position = -(symbol_size * this factor)
	 * Value 0.64 positions bracket slightly above center
	 */
	BRACKET_Y_OFFSET_FACTOR: 0.64,

	/**
	 * Bracket indent (horizontal depth)
	 * Indent = symbol_size / this value
	 * Value 4 = bracket indent is 1/4 of symbol width
	 */
	BRACKET_INDENT_DIVISOR: 4,

	/**
	 * Bracket height scaling factor
	 * Height = symbol_size * this factor
	 * Value 1.3 gives good visual proportion across all symbol sizes
	 * (Previously was hardcoded 1.28, now explicit for clarity)
	 */
	BRACKET_HEIGHT_FACTOR: 1.3,

	// ========================================
	// DECEASED STATUS LINE (diagonal stroke)
	// ========================================

	/**
	 * Dead status line size factor
	 * Line length = symbol_size * this factor
	 * Value 0.6 = line is 60% of symbol width
	 */
	DEAD_LINE_SIZE_FACTOR: 0.6,

	// ========================================
	// PARTNER LINKS (relationship lines)
	// ========================================

	/**
	 * Vertical offset for consanguinity double line
	 * Offset in pixels between the two parallel lines
	 */
	CONSANGUINITY_LINE_OFFSET: 3,

	/**
	 * Length factor for twin horizontal bar (MZ twins)
	 * Bar length = opts.symbol_size / (this value / 3)
	 * Cryptic calculation: for symbol_size=35, bar_length = 35/(6/3) = 17.5
	 */
	TWIN_BAR_LENGTH_DIVISOR: 6,

	// ========================================
	// PROBAND ARROW (indicator arrow)
	// ========================================

	/**
	 * Proband arrow horizontal position factor
	 * Arrow X offset = symbol_size / this factor
	 * Value 0.7 positions arrow ~1.4x symbol width from center
	 */
	ARROW_X_DIVISOR: 0.7,

	/**
	 * Proband arrow vertical position factor
	 * Arrow Y offset = symbol_size / this factor
	 * Value 1.4 positions arrow ~0.7x symbol height from center
	 */
	ARROW_Y_DIVISOR: 1.4,

	/**
	 * Proband arrow head size factor
	 * Arrow head size = symbol_size / this value
	 * Value 6 = arrow head is 1/6th of symbol size
	 */
	ARROW_HEAD_SIZE_DIVISOR: 6,

	/**
	 * Proband arrow shaft width factor
	 * Shaft width = symbol_size / this value
	 * Value 40 = very thin arrow shaft
	 */
	ARROW_SHAFT_WIDTH_DIVISOR: 40,

	// ========================================
	// DIVORCE SYMBOLS (double slash on partner line)
	// ========================================

	/**
	 * Divorce symbol position along partner line
	 * Position = line length * this factor
	 * Value 0.66 = symbol at 2/3 point along the line
	 */
	DIVORCE_X_POSITION: 0.66,

	/**
	 * Divorce slash offset from line center
	 * Offset in pixels for the two parallel slashes
	 */
	DIVORCE_OFFSET: 6,

	/**
	 * Divorce slash length factor
	 * Slash length = symbol_size / this value
	 * Value 3 = slash length is 1/3 of symbol size
	 */
	DIVORCE_SLASH_LENGTH_DIVISOR: 3,

	// ========================================
	// TEXT LABELS (age, yob, monozygotic indicator)
	// ========================================

	/**
	 * Vertical offset for age/yob label below symbol
	 * Offset = symbol_size * this factor
	 * Value 1.6 positions label below the symbol with spacing
	 */
	LABEL_Y_OFFSET_FACTOR: 1.6,

	/**
	 * Font size for age/yob labels
	 * Font size as CSS em value (relative to base font)
	 */
	LABEL_FONT_SIZE: '0.9em',

	/**
	 * Font size for monozygotic twin indicator ("MZ")
	 * Font size as CSS em value
	 */
	MZ_LABEL_FONT_SIZE: '0.8em',

	// ========================================
	// CLASH DETECTION (crossing partner lines)
	// ========================================

	/**
	 * Distance threshold for clash detection
	 * If two partner lines are closer than this (in pixels), it's a clash
	 */
	CLASH_THRESHOLD: 10,

	// ========================================
	// CHILD LINK GEOMETRY
	// ========================================

	/**
	 * Vertical offset for child link fork point
	 * Adjusts where child links split from parent couple
	 */
	CHILD_LINK_FORK_OFFSET: 0,

	// ========================================
	// PIE CHARTS (disease status)
	// ========================================

	/**
	 * Inner radius for pie chart arcs
	 * Value 0 = filled pie, no donut hole
	 */
	PIE_INNER_RADIUS: 0,

	/**
	 * Outer radius multiplier for pie chart
	 * Radius = symbol_size * this factor
	 */
	PIE_OUTER_RADIUS_FACTOR: 0.5,
};

/**
 * Color constants
 * Default colors used in rendering (can be overridden via opts)
 *
 * Note: These are being kept as constants for reference, but actual colors
 * should be made configurable via opts in Phase 3 of the refactoring plan.
 */
export const DEFAULT_COLORS = {
	// Node styling
	NODE_BORDER: 'darkgrey',
	NODE_BORDER_WITH_DATA: '#303030',
	NODE_BORDER_NO_DATA: 'grey',

	// Links
	LINK_DEFAULT: '#000',
	LINK_DEBUG: 'pink',

	// Status indicators
	AFFECTED_FILL: 'darkgrey',
	CLASH_INDICATOR: '#D5494A',
};

/**
 * Export all constants as a single object for convenience
 */
export default {
	...RENDERING_CONSTANTS,
	COLORS: DEFAULT_COLORS
};
