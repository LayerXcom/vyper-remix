export const config: {
  autoA11y: boolean;
  autoAddCss: boolean;
  autoReplaceSvg: boolean;
  familyPrefix: string;
  keepOriginalSource: boolean;
  measurePerformance: boolean;
  mutateApproach: string;
  observeMutations: boolean;
  replacementClass: string;
  searchPseudoElements: boolean;
  showMissingIcons: boolean;
};
export function counter(content: any, ...args: any[]): any;
export namespace dom {
  function css(): any;
  function i2svg(...args: any[]): any;
  function insertCss(): void;
  function watch(...args: any[]): void;
}
export function findIconDefinition(iconLookup: any): any;
export function icon(maybeIconDefinition: any, ...args: any[]): any;
export function layer(assembler: any): any;
export const library: {
  add: Function;
  definitions: {};
  reset: Function;
};
export function noAuto(): void;
export namespace parse {
  function transform(transformString: any): any;
}
export function text(content: any, ...args: any[]): any;
export function toHtml(abstractNodes: any): any;
