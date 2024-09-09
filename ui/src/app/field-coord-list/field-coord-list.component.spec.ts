import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {FieldCoordListComponent} from './field-coord-list.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {LoadingService} from '@services/loading.service';
import {MatLegacySnackBarModule} from '@angular/material/legacy-snack-bar';
import {MatLegacyDialog} from '@angular/material/legacy-dialog';
import {LoginService} from '../auth/login.service';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatLegacyTableModule} from '@angular/material/legacy-table';
import {MatLegacyPaginatorModule} from '@angular/material/legacy-paginator';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CdkTableModule} from '@angular/cdk/table';
import {MatInputModule} from '@angular/material/input';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

describe('FieldCoordListComponent', () => {
  let component: FieldCoordListComponent;
  let fixture: ComponentFixture<FieldCoordListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FieldCoordListComponent],
      imports: [
        HttpClientTestingModule,
        MatLegacySnackBarModule,
        MatSidenavModule,
        MatLegacyTableModule,
        MatLegacyPaginatorModule,
        FormsModule,
        ReactiveFormsModule,
        CdkTableModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule
      ],
      providers: [
        {provide: LoadingService, useValue: {setLoading: () => {}}},
        {provide: LoginService, useValue: {}},
        {provide: MatLegacyDialog, useValue: {}}
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldCoordListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
