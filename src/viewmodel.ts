module powerbi.extensibility.visual {
    "use strict";

  export class VisualViewModel {
      dataPoints: VisualDataPoint[];
  };

  export class VisualDataPoint {
    imageUrl: string;
    selectionId: ISelectionId;
  };

}
