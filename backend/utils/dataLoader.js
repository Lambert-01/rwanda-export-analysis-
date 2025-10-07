/**
 * Data Loader Utility
 * Provides functions to load processed data from JSON files
 */

const fs = require('fs');
const path = require('path');

// Base directory for processed data
const PROCESSED_DATA_DIR = path.join(__dirname, '../../data/processed');

// Alternative path if the above doesn't work
const ALTERNATIVE_DATA_DIR = path.join(__dirname, '../../../data/processed');

/**
 * Load JSON data from a file in the processed data directory
 * @param {string} filename - The name of the JSON file to load
 * @returns {Object|Array} The parsed JSON data
 * @throws {Error} If the file doesn't exist or contains invalid JSON
 */
function loadJsonData(filename) {
  try {
    // Try the primary path first
    let filePath = path.join(PROCESSED_DATA_DIR, filename);

    // If file doesn't exist in primary path, try alternative path
    if (!fs.existsSync(filePath)) {
      filePath = path.join(ALTERNATIVE_DATA_DIR, filename);
      console.log(`📁 Trying alternative path for ${filename}: ${filePath}`);
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found in either location: ${filename}`);
    }

    const data = fs.readFileSync(filePath, 'utf8');
    console.log(`✅ Successfully loaded ${filename} from ${filePath}`);
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`⚠️ File not found: ${filename}`);
      throw new Error(`File not found: ${filename}`);
    }
    console.error(`❌ Error loading ${filename}:`, error.message);
    throw new Error(`Error loading ${filename}: ${error.message}`);
  }
}

/**
 * Check if a processed data file exists
 * @param {string} filename - The name of the file to check
 * @returns {boolean} True if the file exists, false otherwise
 */
function dataFileExists(filename) {
  const filePath = path.join(PROCESSED_DATA_DIR, filename);
  return fs.existsSync(filePath);
}

/**
 * Get a list of all available processed data files
 * @returns {Array<string>} Array of filenames
 */
function listDataFiles() {
  try {
    return fs.readdirSync(PROCESSED_DATA_DIR)
      .filter(file => file.endsWith('.json'));
  } catch (error) {
    console.error('Error listing data files:', error);
    return [];
  }
}

/**
 * Get metadata about the processed data
 * @returns {Object} Metadata object or empty object if not available
 */
function getDataMetadata() {
  try {
    return loadJsonData('metadata.json');
  } catch (error) {
    console.error('Error loading metadata:', error);
    return {};
  }
}

module.exports = {
  loadJsonData,
  dataFileExists,
  listDataFiles,
  getDataMetadata,
  PROCESSED_DATA_DIR
};