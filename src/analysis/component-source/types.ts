import type ts from "typescript";

import type {
  ComponentContract,
  ContractIssue,
  PropDefinition,
} from "../../domain";

export type ComponentAnalysisResult =
  | {
      accepted: true;
      contract: ComponentContract;
      issues: ContractIssue[];
    }
  | {
      accepted: false;
      issues: ContractIssue[];
    };

export interface ImportAnalysis {
  imports: string[];
  issues: ContractIssue[];
  importedBindings: ReadonlySet<string>;
  reactNamespaceBindings: ReadonlySet<string>;
  reactFunctionComponentBindings: ReadonlySet<string>;
}

export type SupportedFunctionLike =
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction;

export interface ResolvedComponent {
  componentName: string;
  declaration: ts.Node;
  functionLike: SupportedFunctionLike;
  fcPropsType?: ts.TypeNode;
}

export interface ComponentResolution {
  component?: ResolvedComponent;
  issues: ContractIssue[];
}

export interface PropsAnalysis {
  props?: PropDefinition[];
  issues: ContractIssue[];
}

export type StaticJsonValue =
  | string
  | number
  | boolean
  | null
  | StaticJsonValue[]
  | { [key: string]: StaticJsonValue };

export type StaticJsonResult =
  | { accepted: true; value: StaticJsonValue }
  | { accepted: false; reason: string };

