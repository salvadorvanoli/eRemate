import { Component } from '@angular/core';
import { TitleAndDescriptionComponent } from '../../shared/components/title-and-description/title-and-description.component';
import { OptionsPanelComponent } from "./components/options-panel/options-panel.component";
import { DataPanelComponent } from "./components/data-panel/data-panel.component";

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [
    TitleAndDescriptionComponent,
    OptionsPanelComponent,
    DataPanelComponent
  ],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.scss'
})
export class ControlPanelComponent {

  selectedDataType: string = 'Usuario';

  onDataTypeSelected(dataType: string) {
    this.selectedDataType = dataType;
  }

}
