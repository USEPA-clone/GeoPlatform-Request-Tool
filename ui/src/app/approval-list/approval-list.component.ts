import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, debounceTime, share, skip, startWith, switchMap, tap} from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {FormControl} from '@angular/forms';
import {forkJoin, iif, Observable, of, throwError} from 'rxjs';

import {LoginService} from '../auth/login.service';
import {BaseService} from '../services/base.service';
import {LoadingService} from '../services/loading.service';
import {CONFIG_SETTINGS} from '../config_settings';
import {EditAccountPropsDialogComponent} from '../dialogs/edit-account-props-dialog/edit-account-props-dialog.component';
import {ConfirmApprovalDialogComponent} from '../dialogs/confirm-approval-dialog/confirm-approval-dialog.component';


export interface AccountProps {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  groups: [];
  organization: string;
  reason: string;
  response: number;
  sponsor: number;
  approved: boolean;
  created: boolean;
  isChecked: boolean;
  needsEditing: boolean;
}

export interface Accounts {
  [id: number]: AccountProps;
}

@Component({
  selector: 'app-approval-list',
  templateUrl: './approval-list.component.html',
  styleUrls: ['./approval-list.component.css']
})
export class ApprovalListComponent implements OnInit {
  accounts: BaseService;
  displayedColumns = ['selected', 'first_name', 'last_name', 'email', 'username', 'organization', 'groups', 'response',
    'sponsor', 'reason', 'approved', 'created', 'delete'];
  // took out "roll" and "user_type"
  selectedAccountIds = [];
  accountsListProps: Accounts = {};
  allChecked: boolean;
  needsEditing: boolean;
  isApprovalReady: boolean;
  roles: Observable<[]>;
  user_types: Observable<[]>;
  searchInput = new FormControl(null);

  constructor(public http: HttpClient, loadingService: LoadingService, public snackBar: MatSnackBar = null,
              public dialog: MatDialog = null, public loginService: LoginService = null) {
    this.accounts = new BaseService('v1/account/approvals/', http, loadingService);
  }

  async ngOnInit() {
    // this was used to give superusers full list when logging in... but they didn't like it
    // this.loginService.is_superuser ? null : this.accounts.filter = {approved_and_created: false};

    // set accounts list record properties
    // this.setAccountsListProps();

    this.accounts.filter = {created: false};
    this.accounts.getItems().pipe(
      tap(response => this.setAccountsListProps(response))
    ).subscribe();
    this.roles = this.http.get<[]>('/v1/account/approvals/roles').pipe(share());
    this.user_types = this.http.get<[]>('/v1/account/approvals/user_types').pipe(share());

    this.searchInput.valueChanges.pipe(
      startWith(this.searchInput.value),
      skip(1),
      debounceTime(300),
      tap(searchInput => this.search(searchInput))
    ).subscribe();
  }

  search(search: any) {
    this.accounts.filter.search = search;
    return this.accounts.runSearch();
  }

  setAccountsListProps(init_accounts) {
    this.needsEditing = false;
    this.isApprovalReady = false;
    // const init_accounts = await this.accounts.getItems().toPromise();
    for (const account of init_accounts) {
      const acctProps: AccountProps = {
        first_name: account.first_name,
        last_name: account.last_name,
        username: account.username,
        email: account.email,
        groups: account.groups,
        organization: account.organization,
        reason: account.reason,
        response: account.response,
        sponsor: account.sponsor,
        approved: account.approved,
        created: account.created,
        isChecked: false,
        needsEditing: null
      };
      this.accountsListProps[account.id] = acctProps;
      this.setNeedsEditing(account);
    }

    this.selectedAccountIds = [];

  }

  getSelectedAccountIds() {
    const selectedAccountIds = [];
    for (const id in this.accountsListProps) {
      if (this.accountsListProps.hasOwnProperty(id) && this.accountsListProps[id].isChecked) {
        const idNum = Number(id);
        selectedAccountIds.push(idNum);
      }
    }
    return selectedAccountIds;
  }

  getApprovalStatus() {
    let isApprovalReady = true;
    for (const id of this.selectedAccountIds) {
      if (this.accountsListProps[id].needsEditing ||
        (this.accountsListProps[id].approved && this.accountsListProps[id].created)) {
        isApprovalReady = false;
      }
    }
    return isApprovalReady;
  }

  updateSelectedAccount(event, all = false) {
    let needsEditing = false;
    this.isApprovalReady = false;
    for (const id in this.accountsListProps) {
      if (this.accountsListProps.hasOwnProperty(id)) {
        if (all) {
          this.accountsListProps[id].isChecked = event.checked;
          this.allChecked = event.checked;
        } else {
          const evtId = event.source.value.toString();
          this.accountsListProps[evtId].isChecked = event.checked;
          if (!event.checked) {
            this.allChecked = event.checked;
          }
        }
        if (this.accountsListProps[id].isChecked) {
          if (this.accountsListProps[id].needsEditing) {
            needsEditing = true;
          }
        }
      }
    }
    this.needsEditing = needsEditing;
    this.selectedAccountIds = this.getSelectedAccountIds();
    if (this.selectedAccountIds.length > 0) {
      this.isApprovalReady = this.getApprovalStatus();
    }
  }

  clearAllSelected() {
    Object.keys(this.accountsListProps).forEach(id => {
      this.accountsListProps[id].isChecked = false;
      this.allChecked = false;
    });
    this.selectedAccountIds = this.getSelectedAccountIds();
  }

  updateRecord(record) {
    return this.http.put(`/v1/account/approvals/${record.id}/`, record).pipe(
      tap(response => {
        this.setNeedsEditing(response);
        this.accounts.dataChange.next(this.accounts.data);
        this.snackBar.open('Success', null, {duration: 2000});
      }),
      catchError(() => of(this.snackBar.open('Error', null, {duration: 3000})))
    );
  }

  editAccountDialog(): void {
    let data = null;
    if (this.selectedAccountIds.length === 1) {
      data = {
        isBulkEdit: false,
        ...this.accountsListProps[this.selectedAccountIds[0]]
      };
    } else {
      const defaults: AccountProps = this.accountsListProps[this.selectedAccountIds[0]];
      for (const id of this.selectedAccountIds) {
        defaults.groups.filter(group => this.accountsListProps[id].groups.includes(group));
        defaults.response = this.accountsListProps[id].response === defaults.response ? defaults.response : null;
        defaults.reason = this.accountsListProps[id].reason === defaults.reason ? defaults.reason : '';
      }
      data = {
        isBulkEdit: true,
        groups: defaults.groups,
        response: defaults.response,
        reason: defaults.reason,
      };
    }
    const dialogRef = this.dialog.open(EditAccountPropsDialogComponent, {
      width: '500px',
      data: data
    });

    dialogRef.afterClosed().pipe(
      switchMap(formInputValues => {
        const accountUpdates = [];
        if (formInputValues) {
          for (const id in this.accountsListProps) {
            if (this.accountsListProps[id].isChecked) {
              const updatedRecord = this.accountsListProps[id];
              updatedRecord['id'] = Number(id);
              for (const key in formInputValues) {
                if (key in updatedRecord) {
                  updatedRecord[key] = formInputValues[key];
                }
              }
              accountUpdates.push(this.updateRecord(updatedRecord));
            }
          }
        }
        return forkJoin(accountUpdates);
      }),
      switchMap(() => this.accounts.getItems()),
      tap(() => this.isApprovalReady = this.getApprovalStatus())).subscribe();
  }

  confirmApproval() {
    let password_needed = false;
    for (const account of this.accounts.data) {
      if (this.selectedAccountIds.indexOf(account.id) > -1 && account.username_valid) {
        password_needed = true;
        break;
      }
    }
    const dialogRef = this.dialog.open(ConfirmApprovalDialogComponent, {
      width: '400px',
      data: {
        password_needed: password_needed
      }
    });
    dialogRef.afterClosed().pipe(switchMap(results => {
        return iif(() => results.confirmed, this.http.post('/v1/account/approvals/approve/',
          {accounts: this.selectedAccountIds, password: results.password}).pipe(
          switchMap(response => iif(() => response !== undefined, this.accounts.getItems().pipe(tap(() => {

            this.snackBar.open('Success', null, {duration: 2000});
            // clear selected accounts after approval issue #33
            this.clearAllSelected();
          }))))
          )
        );
      }),
      catchError(() => of(this.snackBar.open('Error', null, {duration: 3000})))
    ).subscribe();
  }

  confirmDeleteAccountRequest(event, selectedRequest) {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmApprovalDialogComponent, {
      width: '600px',
      data: {
        action: 'delete',
        selected_request: selectedRequest
      }
    });
    dialogRef.afterClosed().pipe(switchMap(results => {
        return iif(() => results.confirmed,
          this.http.delete(`/v1/account/request/${selectedRequest.id}`).pipe(
          switchMap(response => iif(() => response !== undefined,
            this.accounts.getItems().pipe(tap((accountRequests) => {
            this.snackBar.open('Deleted', null, {duration: 2000});
            this.setAccountsListProps(accountRequests);
            this.clearAllSelected();
          }))))
          )
        );
      }),
      catchError((err) => {
        of(this.handleErrorResponse(err));
        return throwError(err);
      })
    ).subscribe();
  }

  setNeedsEditing(account) {
    let needsEditing = false;
    // removed group as requirement for editing per issue #31
    if (!account.organization || !account.response || !account.sponsor || !account.reason) {
      needsEditing = true;
    }
    this.accountsListProps[account.id].needsEditing = needsEditing;
  }

  handleErrorResponse(err: HttpErrorResponse, customErrorMessages?: string[]) {
    if (err && err.error && err.error.detail) {
      this.snackBar.open(err.error.detail, null, {
        duration: CONFIG_SETTINGS.snackbar_duration, panelClass: ['snackbar-error']
      });
    } else if (err && err.error && typeof err.error === 'string') {
      this.snackBar.open(err.error, null, {
        duration: CONFIG_SETTINGS.snackbar_duration, panelClass: ['snackbar-error']
      });
    } else if (err && err.error && err.error instanceof Array) {
      this.snackBar.open(`Error: ${JSON.stringify(err.error[0])}`, null, {
        duration: CONFIG_SETTINGS.snackbar_duration, panelClass: ['snackbar-error']
      });
    } else if (customErrorMessages.length > 0) {
      this.snackBar.open(customErrorMessages.join(', '), null, {
        duration: CONFIG_SETTINGS.snackbar_duration, panelClass: ['snackbar-error']
      });
    } else {
      this.snackBar.open('Error occurred.', null, {
        duration: CONFIG_SETTINGS.snackbar_duration, panelClass: ['snackbar-error']
      });
    }
  }
}
