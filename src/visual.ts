/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    "use strict";

    function visualTransform(options: VisualUpdateOptions, host: IVisualHost, thisRef: Visual): VisualViewModel {            
        let dataViews = options.dataViews;
        let viewModel: VisualViewModel = {
            dataPoints: []
        };
        if ( !Utils.hasValidDataViews(dataViews) ) {
            return viewModel;
        }

        let objects = dataViews[0].metadata.objects;
       
        var selectionIDs = Utils.getSelectionIds(dataViews[0], host);

        let imageUrlIndex = Utils.getColumnIndex(dataViews[0].metadata, "imageUrl");
        
        let visualDataPoints: VisualDataPoint[] = [];
        for( var i = 0; i < dataViews[0].table.rows.length; i++) {
            var row = dataViews[0].table.rows[i];
            visualDataPoints.push({
                imageUrl:  imageUrlIndex !== null ? <string>row[imageUrlIndex] : null,
                selectionId: selectionIDs[i]
            });
        }
 
        return {
            dataPoints: visualDataPoints
        };
    }     

    export class Visual implements IVisual {
        private element: HTMLElement;
        private divImage: HTMLElement;
        private divLeftArrow: HTMLElement;
        private divRightArrow: HTMLElement;
        private host: IVisualHost;
        private selectionManager: ISelectionManager;
        private settings: VisualSettings;
        private model: VisualViewModel;
        private currentImageIndex: number; 

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();
            this.element = options.element;
            this.currentImageIndex = 0;
            if (typeof document !== "undefined") {
                let divImage = this.divImage = document.createElement("div");
                let divLeftArrow = this.divLeftArrow = document.createElement("div");
                let divRightArrow = this.divRightArrow = document.createElement("div");
                divLeftArrow.innerHTML = "<";
                divLeftArrow.className = "arrowLeft";
                divRightArrow.innerHTML = ">";
                divRightArrow.className = "arrowRight";
                this.element.appendChild(divLeftArrow);
                this.element.appendChild(divImage);
                this.element.appendChild(divRightArrow);
                var thisRef = this;
                $(divRightArrow).on("click", function() {
                    if ( thisRef.currentImageIndex < (thisRef.model.dataPoints.length-1) ) {
                        thisRef.currentImageIndex ++;
                        thisRef.updateImage();
                    }
                });
                $(divLeftArrow).on("click", function() {
                    if ( thisRef.currentImageIndex > 0 ) {
                        thisRef.currentImageIndex --;
                        thisRef.updateImage();    
                    }
                });
            }
        }

        public update(options: VisualUpdateOptions) {
            this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
            this.model = visualTransform(options, this.host, this);
            if ( this.currentImageIndex < 0 ) {
                this.currentImageIndex = 0;
            }
            if ( this.currentImageIndex >= this.model.dataPoints.length ) {
                this.currentImageIndex = this.model.dataPoints.length-1;
            }
            let width = options.viewport.width;
            let height = options.viewport.height;
            this.divImage.style.width = width + "px";
            this.divImage.style.height = height + "px";           
            this.updateImage();
        }

        public updateImage() {
            let imgUrl = this.model.dataPoints[this.currentImageIndex].imageUrl
            this.divImage.innerHTML = "<img style='height: 100%; width: 100%; object-fit: contain' src='"+imgUrl+"'>";
            this.divLeftArrow.style.display = this.currentImageIndex === 0 ? "none" : "";
            this.divRightArrow.style.display = this.currentImageIndex === (this.model.dataPoints.length-1) ? "none" : "";
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}