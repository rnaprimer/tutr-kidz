/**
 * Tutr Kidz - Content Model & Pedagogical Relationships (Phase 22)
 *
 * Deterministic representation of curriculum content:
 * Level -> Subject -> Topic -> Learning Concepts -> Next Exploration
 *
 * Lightweight, child-centered metadata designed to answer:
 * "What should I explore next?"
 */

import { CurriculumLevel, SubjectId, TopicId, Difficulty } from "../../types/curriculum";

export interface LearningConcept {
  id: string;
  level: CurriculumLevel;
  subject: SubjectId;
  topicId: TopicId | string;
  title: string;
  description: string;
  learningObjective: string;
  difficulty: Difficulty;
  prerequisites?: string[];
  relatedTopics?: string[];
  nextExplorationTopicId?: string;
}

export interface TopicContentModel {
  id: TopicId | string;
  level: CurriculumLevel;
  subject: SubjectId;
  title: string;
  description: string;
  symbol?: string;
  concepts: LearningConcept[];
  prerequisites: string[];
  relatedTopics: string[];
  nextTopicId?: string;
}

/**
 * Structured curriculum relationships linking topics across levels
 * to their prerequisites, related domains, and natural next explorations.
 */
export const TOPIC_CONTENT_MODELS: Record<string, TopicContentModel> = {
  // --- Toddler Early Learning (Exploratory Circle) ---
  "toddler:colours": {
    id: "colours",
    level: "toddler",
    subject: "early-learning",
    title: "Colours",
    description: "Visual colour recognition and identification",
    symbol: "🎨",
    prerequisites: [],
    relatedTopics: ["shapes", "matching"],
    nextTopicId: "shapes",
    concepts: [
      {
        id: "toddler-concept-colours",
        level: "toddler",
        subject: "early-learning",
        topicId: "colours",
        title: "Colour Recognition",
        description: "Identifying primary and secondary colours",
        learningObjective: "Recognize red, blue, green, and yellow visually",
        difficulty: "easy",
        relatedTopics: ["shapes", "matching"],
        nextExplorationTopicId: "shapes",
      },
    ],
  },
  "toddler:shapes": {
    id: "shapes",
    level: "toddler",
    subject: "early-learning",
    title: "Shapes",
    description: "Basic shape recognition and classification",
    symbol: "🔷",
    prerequisites: ["colours"],
    relatedTopics: ["colours", "matching"],
    nextTopicId: "numbers",
    concepts: [
      {
        id: "toddler-concept-shapes",
        level: "toddler",
        subject: "early-learning",
        topicId: "shapes",
        title: "Shape Recognition",
        description: "Identifying circles, squares, triangles, and stars",
        learningObjective: "Visually differentiate basic geometric shapes",
        difficulty: "easy",
        prerequisites: ["colours"],
        relatedTopics: ["matching"],
        nextExplorationTopicId: "numbers",
      },
    ],
  },
  "toddler:numbers": {
    id: "numbers",
    level: "toddler",
    subject: "early-learning",
    title: "Numbers",
    description: "Foundational counting and visual quantity matching",
    symbol: "🔢",
    prerequisites: ["shapes"],
    relatedTopics: ["matching"],
    nextTopicId: "matching",
    concepts: [
      {
        id: "toddler-concept-numbers",
        level: "toddler",
        subject: "early-learning",
        topicId: "numbers",
        title: "Early Counting",
        description: "Matching small counts from 1 to 5",
        learningObjective: "Count small collections of everyday items",
        difficulty: "easy",
        prerequisites: ["shapes"],
        relatedTopics: ["matching"],
        nextExplorationTopicId: "matching",
      },
    ],
  },
  "toddler:matching": {
    id: "matching",
    level: "toddler",
    subject: "early-learning",
    title: "Matching",
    description: "Associating colours, shapes, and items that belong together",
    symbol: "🧩",
    prerequisites: ["colours", "shapes"],
    relatedTopics: ["colours", "shapes", "numbers"],
    nextTopicId: "colours",
    concepts: [
      {
        id: "toddler-concept-matching",
        level: "toddler",
        subject: "early-learning",
        topicId: "matching",
        title: "Visual Association",
        description: "Matching identical colours and shapes",
        learningObjective: "Pair identical visual attributes",
        difficulty: "easy",
        prerequisites: ["colours", "shapes"],
        relatedTopics: ["colours", "shapes"],
        nextExplorationTopicId: "colours",
      },
    ],
  },

  // --- Class 1 Mathematics ---
  "class-1:numbers": {
    id: "numbers",
    level: "class-1",
    subject: "mathematics",
    title: "Numbers",
    description: "Counting, place value, and comparing quantities",
    symbol: "🔢",
    prerequisites: [],
    relatedTopics: ["addition", "shapes"],
    nextTopicId: "addition",
    concepts: [
      {
        id: "c1-concept-counting",
        level: "class-1",
        subject: "mathematics",
        topicId: "numbers",
        title: "Counting & Quantities",
        description: "Counting items up to 20",
        learningObjective: "Count and identify quantities up to 20",
        difficulty: "easy",
        nextExplorationTopicId: "addition",
      },
    ],
  },
  "class-1:addition": {
    id: "addition",
    level: "class-1",
    subject: "mathematics",
    title: "Addition",
    description: "Combining quantities and adding within 20",
    symbol: "➕",
    prerequisites: ["numbers"],
    relatedTopics: ["numbers", "subtraction"],
    nextTopicId: "subtraction",
    concepts: [
      {
        id: "c1-concept-addition",
        level: "class-1",
        subject: "mathematics",
        topicId: "addition",
        title: "Single Digit Addition",
        description: "Adding numbers within 10 and 20",
        learningObjective: "Solve basic addition facts with confidence",
        difficulty: "easy",
        prerequisites: ["numbers"],
        relatedTopics: ["subtraction"],
        nextExplorationTopicId: "subtraction",
      },
    ],
  },
  "class-1:subtraction": {
    id: "subtraction",
    level: "class-1",
    subject: "mathematics",
    title: "Subtraction",
    description: "Taking away and finding differences within 20",
    symbol: "➖",
    prerequisites: ["addition"],
    relatedTopics: ["addition"],
    nextTopicId: "shapes",
    concepts: [
      {
        id: "c1-concept-subtraction",
        level: "class-1",
        subject: "mathematics",
        topicId: "subtraction",
        title: "Basic Subtraction",
        description: "Subtracting numbers within 10 and 20",
        learningObjective: "Solve basic subtraction facts by taking away",
        difficulty: "easy",
        prerequisites: ["addition"],
        nextExplorationTopicId: "shapes",
      },
    ],
  },
  "class-1:shapes": {
    id: "shapes",
    level: "class-1",
    subject: "mathematics",
    title: "Shapes",
    description: "Identifying 2D shapes and their basic sides",
    symbol: "🔷",
    prerequisites: [],
    relatedTopics: ["measurement"],
    nextTopicId: "measurement",
    concepts: [
      {
        id: "c1-concept-shapes",
        level: "class-1",
        subject: "mathematics",
        topicId: "shapes",
        title: "2D Shape Identification",
        description: "Recognizing triangles, squares, rectangles, circles",
        learningObjective: "Count sides and corners of common 2D shapes",
        difficulty: "easy",
        nextExplorationTopicId: "measurement",
      },
    ],
  },
  "class-1:measurement": {
    id: "measurement",
    level: "class-1",
    subject: "mathematics",
    title: "Measurement",
    description: "Comparing length, height, and weight",
    symbol: "📏",
    prerequisites: ["shapes"],
    relatedTopics: ["shapes", "numbers"],
    nextTopicId: "numbers",
    concepts: [
      {
        id: "c1-concept-measurement",
        level: "class-1",
        subject: "mathematics",
        topicId: "measurement",
        title: "Comparative Measurements",
        description: "Identifying which object is longer, taller, or heavier",
        learningObjective: "Compare two items using non-standard units",
        difficulty: "easy",
        nextExplorationTopicId: "numbers",
      },
    ],
  },

  // --- Class 2 Mathematics ---
  "class-2:numbers": {
    id: "numbers",
    level: "class-2",
    subject: "mathematics",
    title: "Numbers",
    description: "Place value, number patterns, and hundreds",
    symbol: "🔢",
    prerequisites: [],
    relatedTopics: ["addition", "time"],
    nextTopicId: "addition",
    concepts: [],
  },
  "class-2:addition": {
    id: "addition",
    level: "class-2",
    subject: "mathematics",
    title: "Addition",
    description: "Two-digit addition within 100",
    symbol: "➕",
    prerequisites: ["numbers"],
    relatedTopics: ["subtraction", "multiplication"],
    nextTopicId: "subtraction",
    concepts: [],
  },
  "class-2:subtraction": {
    id: "subtraction",
    level: "class-2",
    subject: "mathematics",
    title: "Subtraction",
    description: "Two-digit subtraction within 100",
    symbol: "➖",
    prerequisites: ["addition"],
    relatedTopics: ["addition"],
    nextTopicId: "multiplication",
    concepts: [],
  },
  "class-2:multiplication": {
    id: "multiplication",
    level: "class-2",
    subject: "mathematics",
    title: "Multiplication",
    description: "Repeated addition, arrays, and 2, 5, 10 times tables",
    symbol: "✖️",
    prerequisites: ["addition"],
    relatedTopics: ["division"],
    nextTopicId: "division",
    concepts: [],
  },
  "class-2:division": {
    id: "division",
    level: "class-2",
    subject: "mathematics",
    title: "Division",
    description: "Equal sharing and grouping basics",
    symbol: "➗",
    prerequisites: ["multiplication"],
    relatedTopics: ["multiplication"],
    nextTopicId: "time",
    concepts: [],
  },
  "class-2:time": {
    id: "time",
    level: "class-2",
    subject: "mathematics",
    title: "Time",
    description: "Reading analog clocks, days of the week, months",
    symbol: "⏰",
    prerequisites: ["numbers"],
    relatedTopics: ["shapes"],
    nextTopicId: "shapes",
    concepts: [],
  },
  "class-2:shapes": {
    id: "shapes",
    level: "class-2",
    subject: "mathematics",
    title: "Shapes",
    description: "2D and 3D shapes: cubes, spheres, cylinders",
    symbol: "🔺",
    prerequisites: [],
    relatedTopics: ["time"],
    nextTopicId: "numbers",
    concepts: [],
  },

  // --- Class 3 Mathematics ---
  "class-3:numbers": {
    id: "numbers",
    level: "class-3",
    subject: "mathematics",
    title: "Numbers",
    description: "Thousands, place value, and expanded notation",
    symbol: "🔢",
    prerequisites: [],
    relatedTopics: ["addition"],
    nextTopicId: "addition",
    concepts: [],
  },
  "class-3:addition": {
    id: "addition",
    level: "class-3",
    subject: "mathematics",
    title: "Addition",
    description: "Three-digit addition with carrying",
    symbol: "➕",
    prerequisites: ["numbers"],
    relatedTopics: ["subtraction"],
    nextTopicId: "subtraction",
    concepts: [],
  },
  "class-3:subtraction": {
    id: "subtraction",
    level: "class-3",
    subject: "mathematics",
    title: "Subtraction",
    description: "Three-digit subtraction with borrowing",
    symbol: "➖",
    prerequisites: ["addition"],
    relatedTopics: ["addition"],
    nextTopicId: "multiplication",
    concepts: [],
  },
  "class-3:multiplication": {
    id: "multiplication",
    level: "class-3",
    subject: "mathematics",
    title: "Multiplication",
    description: "Times tables up to 10 and two-digit multiplying",
    symbol: "✖️",
    prerequisites: ["addition"],
    relatedTopics: ["division"],
    nextTopicId: "division",
    concepts: [],
  },
  "class-3:division": {
    id: "division",
    level: "class-3",
    subject: "mathematics",
    title: "Division",
    description: "Division facts and simple remainders",
    symbol: "➗",
    prerequisites: ["multiplication"],
    relatedTopics: ["fractions"],
    nextTopicId: "fractions",
    concepts: [],
  },
  "class-3:fractions": {
    id: "fractions",
    level: "class-3",
    subject: "mathematics",
    title: "Fractions",
    description: "Halves, thirds, quarters, and visual fractions",
    symbol: "🍰",
    prerequisites: ["division"],
    relatedTopics: ["geometry"],
    nextTopicId: "geometry",
    concepts: [],
  },
  "class-3:geometry": {
    id: "geometry",
    level: "class-3",
    subject: "mathematics",
    title: "Geometry",
    description: "Angles, lines, symmetry, and geometric figures",
    symbol: "📐",
    prerequisites: [],
    relatedTopics: ["measurement"],
    nextTopicId: "measurement",
    concepts: [],
  },
  "class-3:measurement": {
    id: "measurement",
    level: "class-3",
    subject: "mathematics",
    title: "Measurement",
    description: "Centimeters, meters, grams, kilograms, liters",
    symbol: "⚖️",
    prerequisites: ["numbers"],
    relatedTopics: ["geometry"],
    nextTopicId: "numbers",
    concepts: [],
  },

  // --- Class 4 Mathematics ---
  "class-4:numbers": {
    id: "numbers",
    level: "class-4",
    subject: "mathematics",
    title: "Numbers",
    description: "Numbers up to 10,000, rounding, and Roman numerals",
    symbol: "🔢",
    prerequisites: [],
    relatedTopics: ["addition"],
    nextTopicId: "addition",
    concepts: [],
  },
  "class-4:addition": {
    id: "addition",
    level: "class-4",
    subject: "mathematics",
    title: "Addition",
    description: "Multi-digit column addition and word problems",
    symbol: "➕",
    prerequisites: ["numbers"],
    relatedTopics: ["subtraction"],
    nextTopicId: "subtraction",
    concepts: [],
  },
  "class-4:subtraction": {
    id: "subtraction",
    level: "class-4",
    subject: "mathematics",
    title: "Subtraction",
    description: "Multi-digit subtraction across zeros",
    symbol: "➖",
    prerequisites: ["addition"],
    relatedTopics: ["addition"],
    nextTopicId: "multiplication",
    concepts: [],
  },
  "class-4:multiplication": {
    id: "multiplication",
    level: "class-4",
    subject: "mathematics",
    title: "Multiplication",
    description: "Multi-digit multiplication and mental math strategies",
    symbol: "✖️",
    prerequisites: ["addition"],
    relatedTopics: ["division"],
    nextTopicId: "division",
    concepts: [],
  },
  "class-4:division": {
    id: "division",
    level: "class-4",
    subject: "mathematics",
    title: "Division",
    description: "Long division basics and word problems",
    symbol: "➗",
    prerequisites: ["multiplication"],
    relatedTopics: ["fractions"],
    nextTopicId: "fractions",
    concepts: [],
  },
  "class-4:fractions": {
    id: "fractions",
    level: "class-4",
    subject: "mathematics",
    title: "Fractions",
    description: "Equivalent fractions, addition of like fractions",
    symbol: "🍰",
    prerequisites: ["division"],
    relatedTopics: ["geometry"],
    nextTopicId: "geometry",
    concepts: [],
  },
  "class-4:geometry": {
    id: "geometry",
    level: "class-4",
    subject: "mathematics",
    title: "Geometry",
    description: "Perimeter, area of rectangles, types of triangles",
    symbol: "📐",
    prerequisites: ["multiplication"],
    relatedTopics: ["measurement"],
    nextTopicId: "measurement",
    concepts: [],
  },
  "class-4:measurement": {
    id: "measurement",
    level: "class-4",
    subject: "mathematics",
    title: "Measurement",
    description: "Converting units of length, mass, capacity, and time",
    symbol: "⚖️",
    prerequisites: ["multiplication"],
    relatedTopics: ["geometry"],
    nextTopicId: "numbers",
    concepts: [],
  },
};

/**
 * Retrieve content model metadata for a given level and topic.
 */
export function getTopicContentModel(
  level: string,
  topicId: string
): TopicContentModel | undefined {
  const key = level + ":" + topicId;
  return TOPIC_CONTENT_MODELS[key];
}

/**
 * Retrieve prerequisite topic IDs for a topic.
 */
export function getTopicPrerequisites(level: string, topicId: string): string[] {
  const model = getTopicContentModel(level, topicId);
  return model ? model.prerequisites : [];
}

/**
 * Retrieve related topic IDs for a topic.
 */
export function getRelatedTopics(level: string, topicId: string): string[] {
  const model = getTopicContentModel(level, topicId);
  return model ? model.relatedTopics : [];
}

/**
 * Deterministically retrieves the natural next exploration topic ID.
 */
export function getNextExplorationTopic(level: string, topicId: string): string | undefined {
  const model = getTopicContentModel(level, topicId);
  return model?.nextTopicId;
}
