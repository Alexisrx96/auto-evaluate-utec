// src/page.service.ts

/**
 * Finds the main header element to use as an anchor for the UI.
 */
export function getEvaluationHeader(): HTMLElement | null {
    return document.querySelector('#lbl_nombre_cuestionario');
}

/**
 * Finds all selectable <select> elements on the page.
 */
export function getSelectableQuestions(): NodeListOf<HTMLSelectElement> {
    return document.querySelectorAll('select.browser-default');
}

/**
 * Finds all <h3> elements that represent a score section.
 */
export function getScoreSections(): NodeListOf<HTMLHeadingElement> {
    return document.querySelectorAll('div.grupos-preguntas > h3');
}

/**
 * Dispatches a 'change' event on a given element to trigger
 * the web page's internal logic.
 */
export function dispatchChangeEvent(element: HTMLElement): void {
    element.dispatchEvent(new Event('change', { bubbles: true }));
}
