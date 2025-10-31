// src/evaluator.ts
import { SelectionStrategy } from "./types"; // <-- Imports the function type

const MAX_SCORE_PER_QUESTION: number = 4;

/**
 * Applies the selected strategy to all <select> elements.
 * (This function is unchanged, as it was already pure)
 *
 * @param selects The <select> elements to fill.
 * @param strategyFn The function that implements the selection logic.
 * @returns The number of questions that were filled.
 */
export function selectAnswers(
    selects: NodeListOf<HTMLSelectElement>,
    strategyFn: SelectionStrategy // <-- Accepts the strategy function
): number {
    let questionsFilledCount: number = 0;

    selects.forEach((select: HTMLSelectElement) => {
        const options: HTMLOptionElement[] = Array.from(select.options)
            .filter((o: HTMLOptionElement) => !o.disabled && o.value !== '');
        if (!options.length) return;

        // Clear previous selections
        options.forEach(o => o.selected = false);

        if (select.multiple) {
            // --- Handle Multiple Select (Always Random) ---
            const maxToSelect = options.length;
            const numToSelect = Math.floor(Math.random() * maxToSelect) + 1;
            const shuffledOptions = [...options].sort(() => 0.5 - Math.random());
            for (let i = 0; i < numToSelect; i++) {
                shuffledOptions[i].selected = true;
            }
        } else {
            // --- OCP-compliant logic ---
            // It doesn't know *what* the strategy is, it just runs it.
            const optionToSelect = strategyFn(options);
            if (optionToSelect) {
                select.value = optionToSelect.value;
            }
            // ---------------------------
        }

        questionsFilledCount++;
    });

    return questionsFilledCount;
}

/**
 * Calculates scores based on the current state of the form.
 * (This is the reverted, correct version)
 *
 * @param sections The <h3> elements representing each section.
 * @returns An array of formatted score strings.
 */
export function calculateScores(
    sections: NodeListOf<HTMLHeadingElement>
): string[] {
    const sectionScores: string[] = [];

    sections.forEach((sectionTitleEl: HTMLHeadingElement) => {
        const sectionTitle: string = sectionTitleEl.textContent?.trim() || 'Sección Desconocida';
        const sectionContainer: HTMLDivElement | null = sectionTitleEl.closest('.grupos-preguntas');
        if (!sectionContainer) return;

        const questions: NodeListOf<HTMLSelectElement> = sectionContainer.querySelectorAll(
            'select.browser-default:not([multiple])'
        );

        let totalScore: number = 0;
        let questionsCount: number = 0;

        questions.forEach((q: HTMLSelectElement) => {
            const validOptions: HTMLOptionElement[] = Array.from(q.options)
                .filter((o: HTMLOptionElement) => !o.disabled && o.value !== '');
            if (validOptions.length === 0) return;

            const selectedIndex = validOptions.findIndex(o => o.value === q.value);
            if (selectedIndex !== -1) {
                // Map index 0->4, 1->3, 2->2, 3->1, 4->0
                const score = MAX_SCORE_PER_QUESTION - selectedIndex;
                if (score >= 0) {
                    totalScore += score;
                }
                questionsCount++;
            }
        });

        if (questionsCount > 0) {
            const maxPossibleScore: number = questionsCount * MAX_SCORE_PER_QUESTION;
            const percentage: number = Math.round((totalScore / maxPossibleScore) * 100);
            const scoreText = `${sectionTitle}: ${percentage}% (${totalScore}/${maxPossibleScore})`;
            sectionScores.push(scoreText);
        }
    });

    return sectionScores;
}
