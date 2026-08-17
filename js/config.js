// ─── App Configuration ────────────────────────────────────────────────────────
export const APP_CONFIG = {
  name: 'EduQuery',
  version: '1.0.0',
  demoMode: true,
  aiTypingSpeed: 18, // ms per character
};

// ─── Subject Categories ────────────────────────────────────────────────────────
export const CATEGORIES = [
  {
    id: 'cse',
    name: 'Computer Science Engineering',
    icon: '💻',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    tags: ['Algorithms', 'Data Structures', 'OS', 'DBMS', 'Networks', 'OOP', 'Compilers'],
    description: 'Explore programming, algorithms, and core CS concepts.',
  },
  {
    id: 'jee',
    name: 'JEE Aspirants',
    icon: '⚛️',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    tags: ['Physics', 'Chemistry', 'Mathematics', 'Mechanics', 'Calculus', 'Organic Chem'],
    description: 'Physics, Chemistry, and Math for IIT-JEE preparation.',
  },
  {
    id: 'neet',
    name: 'NEET Aspirants',
    icon: '🧬',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    tags: ['Biology', 'Chemistry', 'Botany', 'Zoology', 'Physiology', 'Genetics'],
    description: 'Biology and Chemistry for medical entrance preparation.',
  },
  {
    id: 'ds',
    name: 'Data Science & ML',
    icon: '📊',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    tags: ['Python', 'Machine Learning', 'Deep Learning', 'Statistics', 'NLP', 'SQL'],
    description: 'Statistics, ML, AI and data analysis techniques.',
  },
  {
    id: 'math',
    name: 'Mathematics',
    icon: '📐',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    tags: ['Algebra', 'Calculus', 'Geometry', 'Number Theory', 'Probability', 'Linear Algebra'],
    description: 'Pure and applied mathematics at every level.',
  },
  {
    id: 'science',
    name: 'General Science',
    icon: '🔬',
    color: '#14b8a6',
    gradient: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
    tags: ['Physics', 'Chemistry', 'Biology', 'Earth Science', 'Astronomy'],
    description: 'Broad science questions across all disciplines.',
  },
  {
    id: 'history',
    name: 'History & Social Studies',
    icon: '📜',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #d97706, #b45309)',
    tags: ['World History', 'Indian History', 'Geography', 'Civics', 'Economics', 'Political Science'],
    description: 'Social sciences, history, and civics.',
  },
  {
    id: 'english',
    name: 'English & Literature',
    icon: '📚',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    tags: ['Grammar', 'Literature', 'Writing', 'Poetry', 'Essays', 'Comprehension'],
    description: 'Language arts, grammar, and literary analysis.',
  },
];

// ─── Demo Users ───────────────────────────────────────────────────────────────
export const DEMO_USERS = [
  { id: 'u1', name: 'Arjun Sharma', avatar: 'AS', category: 'jee', points: 340 },
  { id: 'u2', name: 'Priya Mehta', avatar: 'PM', category: 'neet', points: 290 },
  { id: 'u3', name: 'Rohit Kumar', avatar: 'RK', category: 'cse', points: 520 },
  { id: 'u4', name: 'Sneha Patel', avatar: 'SP', category: 'ds', points: 410 },
  { id: 'u5', name: 'Vikram Singh', avatar: 'VS', category: 'math', points: 275 },
  { id: 'u6', name: 'Ananya Bose', avatar: 'AB', category: 'english', points: 190 },
];

// ─── Demo Questions ───────────────────────────────────────────────────────────
export const DEMO_QUESTIONS = [
  {
    id: 'q1',
    userId: 'u3',
    category: 'cse',
    title: 'What is the difference between BFS and DFS?',
    body: 'I\'m confused about when to use BFS vs DFS in graph traversal. Can someone explain with examples?',
    tags: ['Algorithms', 'Data Structures'],
    upvotes: 42,
    bookmarks: 18,
    answers: 3,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    answered: true,
  },
  {
    id: 'q2',
    userId: 'u1',
    category: 'jee',
    title: 'How to solve projectile motion problems quickly?',
    body: 'I keep making mistakes in projectile motion. Is there a systematic approach to solve these in JEE?',
    tags: ['Physics', 'Mechanics'],
    upvotes: 67,
    bookmarks: 31,
    answers: 5,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    answered: true,
  },
  {
    id: 'q3',
    userId: 'u2',
    category: 'neet',
    title: 'Explain the process of DNA replication step by step',
    body: 'Could someone explain DNA replication with all the enzymes involved and their specific roles?',
    tags: ['Biology', 'Genetics'],
    upvotes: 55,
    bookmarks: 24,
    answers: 4,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    answered: true,
  },
  {
    id: 'q4',
    userId: 'u4',
    category: 'ds',
    title: 'What is overfitting in machine learning and how to prevent it?',
    body: 'My model performs great on training data but poorly on test data. How do I fix this?',
    tags: ['Machine Learning', 'Deep Learning'],
    upvotes: 89,
    bookmarks: 45,
    answers: 6,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    answered: true,
  },
  {
    id: 'q5',
    userId: 'u5',
    category: 'math',
    title: 'How to integrate using partial fractions?',
    body: 'I struggle with decomposing rational functions into partial fractions for integration. Need clear steps.',
    tags: ['Calculus', 'Algebra'],
    upvotes: 34,
    bookmarks: 16,
    answers: 2,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    answered: true,
  },
  {
    id: 'q6',
    userId: 'u6',
    category: 'english',
    title: 'What are the major themes in Shakespeare\'s Hamlet?',
    body: 'Writing an essay on Hamlet and need to understand the core themes beyond just revenge.',
    tags: ['Literature', 'Essays'],
    upvotes: 28,
    bookmarks: 12,
    answers: 3,
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    answered: true,
  },
];

// ─── AI Response Templates ─────────────────────────────────────────────────────
export const AI_RESPONSES = {
  cse: [
    (q) => `## 🤖 AI Answer

Great question! Here's a comprehensive explanation:

### Understanding the Concept

${q.length < 30 ? 'This is a fundamental topic in Computer Science.' : 'Based on your question, let me break this down systematically.'}

**Key Points to Remember:**
- Computer Science concepts build upon each other hierarchically
- Understanding fundamentals makes advanced topics easier
- Practice with real code examples is essential

### Detailed Explanation

In Computer Science Engineering, this type of problem is typically approached using **systematic analysis**. Let's walk through it:

1. **Identify the core problem** — Break down what's being asked
2. **Choose the right data structure or algorithm** — Time/space complexity matters
3. **Implement and test** — Edge cases are crucial

### Example

\`\`\`python
# Practical demonstration
def solve_problem(input_data):
    # Step 1: Initialize
    result = []
    
    # Step 2: Process
    for item in input_data:
        result.append(process(item))
    
    # Step 3: Return
    return result
\`\`\`

### Time Complexity
- **Best Case:** O(log n)
- **Average Case:** O(n log n)  
- **Worst Case:** O(n²)

### Further Reading
- GeeksforGeeks, LeetCode, and CLRS (Introduction to Algorithms)
- Practice on competitive programming platforms

> 💡 **Pro Tip:** Always analyze time and space complexity before coding!`,
  ],
  jee: [
    (q) => `## 🤖 AI Answer

Excellent question for JEE preparation! Let me give you a structured approach.

### Conceptual Foundation

This topic falls under a crucial area of JEE Physics/Chemistry/Math. Understanding it deeply will help you solve related problems quickly.

**Formula Sheet:**
$$F = ma \\quad \\text{(Newton's Second Law)}$$
$$E = mc^2 \\quad \\text{(Mass-Energy Equivalence)}$$
$$v² = u² + 2as \\quad \\text{(Kinematic Equation)}$$

### Step-by-Step Solution Method

**Step 1:** Draw a clear diagram and label all known quantities

**Step 2:** Identify the principle or formula to apply
- Conservation laws (energy, momentum, charge)
- Equilibrium conditions
- Boundary conditions

**Step 3:** Set up equations systematically

**Step 4:** Solve algebraically before substituting numbers

**Step 5:** Check units and order of magnitude

### Common Mistakes to Avoid ⚠️
- Not considering all forces acting on the system
- Forgetting to convert units (degrees ↔ radians, etc.)
- Sign errors in vector quantities

### JEE-Level Tricks 🎯
- Use energy methods when forces are complex
- Symmetry arguments can simplify calculations dramatically
- Practice 10-15 problems of each type for mastery

> 📚 **Resources:** HC Verma, DC Pandey, Previous Year JEE Papers (2010-2024)`,
  ],
  neet: [
    (q) => `## 🤖 AI Answer

Perfect NEET question! Here's a detailed, exam-focused answer.

### Key Concept Overview

This is a high-weightage topic in NEET Biology/Chemistry. Let me explain it clearly with diagrams in mind.

### Biological Mechanism

The process involves several carefully coordinated steps:

**Phase 1 — Initiation**
- Trigger signals activate specific enzymes
- Substrates bind to active sites (lock-and-key model)

**Phase 2 — Elongation/Progression**
- Enzymatic reactions proceed in sequence
- Energy (ATP) is consumed or produced
- Regulatory checkpoints ensure accuracy

**Phase 3 — Termination**
- Products are released
- Enzymes return to their original state
- Feedback mechanisms regulate the process

### Important Enzymes & Their Roles

| Enzyme | Role | Location |
|--------|------|----------|
| Helicase | Unwinds DNA | Nucleus |
| Polymerase | Synthesizes new strand | Nucleus |
| Ligase | Joins Okazaki fragments | Nucleus |

### NCERT Reference Points 📖
- This topic is covered in **NCERT Class 12, Chapter [Relevant Chapter]**
- Always read NCERT diagrams carefully — they're directly asked in NEET

### Mnemonics for Quick Recall 🧠
**"PRICE"** — Process, Reactants, Intermediates, Catalysts, End-products

> ✅ **NEET Tip:** 60-70% of NEET Biology questions come directly from NCERT. Read it 3 times!`,
  ],
  ds: [
    (q) => `## 🤖 AI Answer

Great Data Science question! Here's a thorough technical explanation.

### Overview

This is a core concept in Data Science and Machine Learning that every practitioner must understand deeply.

### Theoretical Background

**The Mathematical Foundation:**

$$\\text{Loss} = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2$$

Understanding this leads to better model development decisions.

### Practical Implementation

\`\`\`python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Load and prepare data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Normalize features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Evaluate model performance
from sklearn.metrics import accuracy_score, classification_report
print(classification_report(y_test, predictions))
\`\`\`

### Common Techniques

1. **Regularization** — L1 (Lasso) and L2 (Ridge)
2. **Cross-validation** — K-Fold CV for robust evaluation
3. **Early stopping** — Prevent overfitting in neural networks
4. **Dropout** — Regularization technique for deep learning
5. **Ensemble methods** — Bagging, Boosting, Stacking

### Visualization Tips 📊
Always visualize your results — learning curves, confusion matrices, and ROC curves tell the full story.

> 🔗 **Resources:** Kaggle, fast.ai, Andrew Ng's Coursera ML course, Hands-on ML book`,
  ],
  math: [
    (q) => `## 🤖 AI Answer

Excellent math question! Let me provide a rigorous yet accessible explanation.

### Problem Analysis

Mathematics requires precision. Let me break this down from first principles.

### Theoretical Framework

**Definitions:**
Let's define our terms carefully before proceeding.

**Theorem:**
For any valid mathematical structure, the following properties hold:
1. **Closure** — Operations remain within the set
2. **Associativity** — Grouping doesn't affect result  
3. **Identity** — Neutral element exists
4. **Inverse** — Every element has an opposite

### Step-by-Step Solution

**Step 1:** Establish the given information
$$\\text{Given: } f(x) = ax^2 + bx + c$$

**Step 2:** Apply the relevant theorem or formula
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

**Step 3:** Simplify systematically
- Factor common terms
- Cancel where possible
- Verify domain restrictions

**Step 4:** Verify the answer
- Substitute back into original equation
- Check boundary conditions
- Consider special cases

### Common Pitfalls ⚠️
- Division by zero — always check denominators
- Square root of negative numbers — note complex solutions
- Losing solutions when squaring both sides

> 📐 **Study Tip:** Mathematics is learned by doing. Solve at least 20 problems per concept.`,
  ],
  science: [
    (q) => `## 🤖 AI Answer

Great science question! Here's a clear, comprehensive answer.

### Scientific Explanation

This phenomenon is governed by fundamental scientific principles that have been well-established through experimentation.

### The Core Principle

**Scientific Method Applied:**
1. **Observation** — What we see in nature
2. **Hypothesis** — Proposed explanation
3. **Experiment** — Testing the hypothesis
4. **Conclusion** — What the evidence supports

### Detailed Mechanism

The process works through the following scientific principles:

- **Conservation Laws** — Energy, mass, and momentum are conserved
- **Thermodynamic Principles** — Heat flows from hot to cold
- **Electromagnetic Interactions** — Charges create fields that exert forces
- **Quantum Effects** — At atomic scales, quantization matters

### Real-World Applications 🌍
This concept explains:
- How your smartphone works
- Why the sky is blue (Rayleigh scattering)
- How airplanes generate lift
- Why ice floats on water

> 🔬 **Experiment Idea:** You can verify this at home with simple materials!`,
  ],
  history: [
    (q) => `## 🤖 AI Answer

Fascinating historical question! Let me provide context and analysis.

### Historical Context

Understanding history requires examining events through multiple lenses: political, economic, social, and cultural.

### Timeline of Events

| Period | Key Events | Significance |
|--------|-----------|--------------|
| Ancient | Foundation of civilizations | Set cultural patterns |
| Medieval | Trade routes, feudal systems | Economic development |
| Modern | Industrial revolution | Transformed society |
| Contemporary | Globalization | Connected world |

### Multiple Perspectives 🌐

**Political Perspective:**
Power structures and governance shaped this period significantly.

**Economic Perspective:**
Trade, resources, and economic systems drove many decisions.

**Social Perspective:**
The lives of ordinary people were transformed during this era.

### Cause and Effect Analysis
- **Primary Cause:** [Key triggering event]
- **Secondary Causes:** [Contributing factors]
- **Immediate Effects:** [Short-term consequences]
- **Long-term Impact:** [How it shaped the future]

### Key Figures & Their Contributions
Historical events are shaped by individuals acting within their context.

> 📜 **Essay Tip:** Always provide specific dates, names, and evidence. Analysis + evidence = high marks!`,
  ],
  english: [
    (q) => `## 🤖 AI Answer

Wonderful literary question! Here's a detailed analysis.

### Literary Analysis Framework

When analyzing literature, we examine: **Theme, Character, Setting, Plot, Style, and Symbolism**.

### Thematic Exploration

Great literature explores universal human experiences:

**Primary Themes:**
1. **Identity and Self-Discovery** — Characters confront who they are
2. **Power and Corruption** — Authority and its misuse
3. **Love and Loss** — Human relationships in all forms
4. **Social Justice** — Critique of societal structures

### Character Analysis

**Protagonist:**
- Motivations and desires
- Internal conflicts
- Character arc (how they change)

**Antagonist:**
- Their perspective (every villain is the hero of their story)
- How they create conflict

### Literary Devices Used 🖊️
- **Metaphor** — Implicit comparison
- **Symbolism** — Objects representing ideas
- **Foreshadowing** — Hints at future events
- **Irony** — Contrast between expectation and reality

### Sample Essay Structure
1. **Introduction** — Hook + thesis statement
2. **Body Paragraph 1** — First main argument + evidence
3. **Body Paragraph 2** — Second argument + textual evidence
4. **Body Paragraph 3** — Counterargument + rebuttal
5. **Conclusion** — Synthesis + broader significance

> ✍️ **Writing Tip:** Use the PEE method: Point → Evidence → Explanation`,
  ],
};

// ─── Leaderboard Data ─────────────────────────────────────────────────────────
export const LEADERBOARD = DEMO_USERS.sort((a, b) => b.points - a.points);
