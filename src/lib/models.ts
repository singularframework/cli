export interface SgData {

  version: string;
  singular?: {
    cli: string;
    useLocal?: boolean;
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
