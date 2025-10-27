
// Define la estructura básica del objeto noUiSlider para su uso en TypeScript
interface noUiSlider {
    // Declaración del método 'on' con sobrecarga para los eventos más comunes
    on(eventName: 'update' | 'slide' | 'set', callback: (values: (string | number)[], handle: number, unencoded: number[], tap: boolean, positions: number[], toggled: boolean) => void): void;
    // Declaración genérica para otros eventos
    on(eventName: string, callback: (...args: any[]) => void): void;
    // Métodos esenciales
    get(): string[] | string;
    set(value: (string | number)[] | string | number): void;
    destroy(): void;
    // Añade otros métodos o propiedades de noUiSlider que uses si son necesarios
}

// Extiende la interfaz global de HTMLElement
// Esto resuelve el error TS2339 al declarar que 'noUiSlider' existe
interface HTMLElement {
    noUiSlider: noUiSlider;
}