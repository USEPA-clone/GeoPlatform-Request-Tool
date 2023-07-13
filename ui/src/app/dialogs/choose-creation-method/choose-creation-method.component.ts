import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogData} from "../confirm-approval-dialog/confirm-approval-dialog.component";

interface ChooseCreationMethodData {
  existing_only: boolean;
}

@Component({
  selector: 'app-choose-creation-method',
  templateUrl: './choose-creation-method.component.html',
  styleUrls: ['./choose-creation-method.component.css']
})
export class ChooseCreationMethodComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ChooseCreationMethodComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ChooseCreationMethodData) { }

  ngOnInit() {

  }

}
