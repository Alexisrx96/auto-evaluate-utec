// src/evaluator.ts
import { Strategy } from "./types";

/**
 * Mapa para convertir los valores de las opciones de <select> a un puntaje numérico.
 */
const scoreMap: Record<string, number> = {
    '508': 4,
    '509': 3,
    '510': 2,
    '511': 1,
    '512': 0,
    '525': 4,
    '526': 0,
};
const MAX_SCORE_PER_QUESTION: number = 4;

/**
 * Fill out the form and calculate the scores.
 * @param strategy The evaluation strategy to use
 * @param scorePanel The <ul> element to log results to
 * @returns {void}
 */
export function autoEvaluate(strategy: Strategy, scorePanel: HTMLUListElement): void {
    scorePanel.innerHTML = '';
    scorePanel.style.display = 'block';

    const selects: NodeListOf<HTMLSelectElement> = document.querySelectorAll('select.browser-default');
    let questionsFilledCount: number = 0;

    if (selects.length === 0) {
        scorePanel.innerHTML = '<pre>No se encontraron preguntas (selects).</pre>';
        return;
    }

    // --- 1. Fill Questions ---
    selects.forEach((select: HTMLSelectElement) => {
        if (select.multiple) return;

        const options: HTMLOptionElement[] = Array.from(select.options)
            .filter((o: HTMLOptionElement) => !o.disabled && o.value !== '');

        if (!options.length) return;

        let optionToSelect: HTMLOptionElement;
        switch (strategy) {
            case 'first':
                optionToSelect = options[0];
                break;
            case 'last':
                optionToSelect = options[options.length - 1];
                break;
            case 'random':
                optionToSelect = options[Math.floor(Math.random() * options.length)];
                break;
            default:
                optionToSelect = options[0];
        }

        select.value = optionToSelect.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        questionsFilledCount++;
    });


    // --- 2. Calculate Scores ---
    scorePanel.innerHTML = '<pre><strong>Puntajes por Sección (basado en la evaluación aplicada):</strong>\n\n</pre>';

    const sectionScores: string[] = [];
    const sections: NodeListOf<HTMLDivElement> = document.querySelectorAll('div.grupos-preguntas > h3');

    sections.forEach((sectionTitleEl: HTMLHeadingElement) => {
        const sectionTitle: string = sectionTitleEl.textContent?.trim() || 'Sección Desconocida';
        const sectionContainer: HTMLDivElement | null = sectionTitleEl.closest('.grupos-preguntas');

        if (!sectionContainer) return;

        // Find all questions in this section
        const questions: NodeListOf<HTMLSelectElement> = sectionContainer.querySelectorAll(
            'select.browser-default:not([multiple])'
        );

        let totalScore: number = 0;
        let questionsCount: number = 0;

        questions.forEach((q: HTMLSelectElement) => {
            const selectedValue: string = q.value; // Obtener el valor que acabamos de setear
            if (selectedValue && scoreMap[selectedValue] !== undefined) {
                totalScore += scoreMap[selectedValue];
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

    // --- 3. Show Scores ---
    const logPreElement = scorePanel.querySelector('pre');
    if (sectionScores.length > 0 && logPreElement) {
        logPreElement.innerHTML += sectionScores.join('\n');
    } else if (logPreElement) {
        logPreElement.innerHTML = '<pre>No se pudieron calcular los puntajes.</pre>';
    }

    // --- 4. Add Summary ---
    const summary: HTMLLIElement = document.createElement('li');
    summary.style.cssText = `
        font-weight: bold;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid rgba(60, 64, 67, 0.2);
        list-style: none;
    `;
    summary.textContent = `Total: ${questionsFilledCount} preguntas completadas.`;
    scorePanel.appendChild(summary);
}
