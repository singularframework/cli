export interface SgData {

  version: string;
  singular?: {
    cli: string;
    project: {
      name: string;
      tests: boolean;
      docs: boolean;
      flat: boolean;
      assets: string[];
    }
  };
  projectRoot?: string;

}
