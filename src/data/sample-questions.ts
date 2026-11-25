import type { Question } from "@/lib/types";

/**
 * Sample starter questions for Demo Mode (no Supabase connected yet).
 * In live mode the bank starts empty and students add their own questions —
 * the same records are also provided in supabase/seed.sql.
 */
const t0 = Date.now() - 1000 * 60 * 60 * 24 * 3; // 3 days ago

function q(
  i: number,
  question: string,
  answers: [string, string, string, string],
  correct: Question["correct"],
  category: string,
  difficulty: Question["difficulty"],
): Question {
  return {
    id: `sample-${i}`,
    question,
    answers: { A: answers[0], B: answers[1], C: answers[2], D: answers[3] },
    correct,
    category,
    difficulty,
    authorId: "local-guest",
    authorName: "Sample",
    createdAt: new Date(t0 + i * 1000 * 60 * 37).toISOString(),
  };
}

export const SAMPLE_QUESTIONS: Question[] = [
  q(1, "Which document declared that “all men are created equal” and later became a touchstone for civil rights arguments?", ["The Constitution", "The Declaration of Independence", "The Emancipation Proclamation", "The Gettysburg Address"], "B", "General", "Easy"),
  q(2, "The 13th Amendment, ratified in 1865, accomplished which of the following?", ["Granted Black men the right to vote", "Abolished slavery in the United States", "Established the Freedmen’s Bureau", "Ended Reconstruction"], "B", "Unit 1", "Easy"),
  q(3, "What was the primary purpose of the Freedmen’s Bureau?", ["To enforce Black Codes in the South", "To negotiate peace with Confederate states", "To help formerly enslaved people with food, housing, education, and legal matters", "To oversee the first transcontinental railroad"], "C", "Unit 1", "Medium"),
  q(4, "Which case did the Supreme Court use to establish the “separate but equal” doctrine in 1896?", ["Brown v. Board of Education", "Plessy v. Ferguson", "Dred Scott v. Sandford", "Loving v. Virginia"], "B", "Unit 2", "Easy"),
  q(5, "Roughly how long did Reconstruction last before federal troops withdrew from the South?", ["About 3 years (1865–1868)", "About 12 years (1865–1877)", "About 30 years (1865–1895)", "About 45 years (1865–1910)"], "B", "Unit 1", "Hard"),
  q(6, "Booker T. Washington and W. E. B. Du Bois disagreed most famously over which issue?", ["Whether to pursue industrial education or immediate higher education and civil rights", "Whether slavery should be abolished", "Whether to support the Republican Party", "Whether to move West to homestead"], "A", "Unit 2", "Medium"),
  q(7, "The Great Migration refers to which movement of people?", ["Enslaved people escaping to Northern states via the Underground Railroad", "African Americans moving from the rural South to Northern and Western cities", "Settlers traveling the Oregon Trail", "Immigrants arriving through Ellis Island"], "B", "Unit 3", "Medium"),
  q(8, "Which organization, founded in 1909, fought segregation through the courts and remains active today?", ["The NAACP", "The Southern Christian Leadership Conference", "The Congress of Racial Equality", "The Universal Negro Improvement Association"], "A", "Unit 3", "Easy"),
];
