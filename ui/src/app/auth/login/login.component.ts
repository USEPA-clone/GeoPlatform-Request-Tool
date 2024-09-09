import {Component, OnInit} from '@angular/core';
import {LoginService} from '../login.service';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {map, catchError, tap} from 'rxjs/operators';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string;
  password: string;
  showNewUserMessage = false;
  geosecure: boolean;
  geoportal: boolean;

  constructor(public loginService: LoginService, public route: ActivatedRoute, public router: Router) {
  }

  ngOnInit() {
    this.checkQueryParams();
  }

  login(loginType: string) {
    this.loginService.sendToLogin(loginType, window.location.origin + this.route.snapshot.queryParams.next);
  }

  checkQueryParams() {
    this.showNewUserMessage = this.route.snapshot.queryParams.next.includes('new_response=true');
    this.geosecure = this.route.snapshot.queryParams.next.toLowerCase().includes('#geosecure');
    this.geoportal = this.route.snapshot.queryParams.next.toLowerCase().includes('#geoplatform');
  }

  // can not use b/c it would break mapping
  // loginWithCredentials() {
  //   this.login_error = '';
  //   this.loginService.login(this.username, this.password).pipe(
  //     catchError(error => {
  //       let error_object = JSON.parse(error.error);
  //       this.login_error = error_object.non_field_errors[0];
  //     }),
  //     map(response => this.router.navigate(['dashboard']))
  //   ).subscribe();
  // }
}
