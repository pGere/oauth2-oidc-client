/*
 * Copyright 2017 meodzs and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.s
 */

import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpHeaders
} from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import { RouterExtensions } from "nativescript-angular/router";
import { HttpClient } from "@angular/common/http";
import { Subject, ReplaySubject, Subscription } from "rxjs";
import { map, filter, switchMap, timeout } from "rxjs/operators";
import { timer } from "rxjs/observable/timer";


// Observable class extensions
import "rxjs/add/observable/of";

// Observable operators
import "rxjs/add/operator/map";
import "rxjs/add/operator/do";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";

@Injectable()
export class AuthService  {
    constructor(private router: RouterExtensions, private http: HttpClient ) {

    }
    private token: string;
    private refreshToken: string;
    private loginRoute: string;
    private accessTimer: Subscription;
    private refreshTimer: Subscription;
    private isAuthenticated: boolean;
    public authenticated() {
        return this.isAuthenticated;
    }

    public getToken() {
        return this.token;
    }

    public login() {
        this.router.navigate([this.loginRoute], { clearHistory: true });
        this.token = "";
        this.refreshToken = "";
        this.isAuthenticated = false;
        this.refreshTimer.unsubscribe();
        this.accessTimer.unsubscribe();
    }
    public logout() {
        this.init();
    }

    public init(code?: string, loginRoute?: string, homeRoute?: string, host?: string, clientId?: string, clientSecret?: string ) {
        this.token = "";
        this.refreshToken = "";
        this.isAuthenticated = false;
        if (code == null) {
            this.login();
            return;
        }
        this.loginRoute = loginRoute;
        let options = {
            headers: new HttpHeaders().set("Content-Type", "application/x-www-form-urlencoded")
        };
        interface ITokens {
            "access_token": string;
            "expires_in": number;
            "refresh_expires_in": number;
            "refresh_token": string;
            "token_type": string;
            "id_token": string;
            "not-before-policy": number;
            "session_state": string;
        }
        let renewToken = (res: any) => {
            this.accessTimer = timer(res.expires_in).subscribe(() => {
                this.http.post(`${host}/auth/realms/public/protocol/openid-connect/token`,
                `client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=app&grant_type=refresh_token&refresh_token=${this.refreshToken}`,
                options).map(res2 => <ITokens>res2).subscribe(res2 => {
                    renewToken(res2);
                });
            });
        };
        this.http.post(`${host}/auth/realms/public/protocol/openid-connect/token`,
        `client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=app&grant_type=authorization_code&code=${code}`,
        options).map(res => <ITokens>res).subscribe(res => {
            this.token = res.access_token;
            this.refreshToken = res.refresh_token;
            this.isAuthenticated = true;
            this.router.navigate([homeRoute], { clearHistory: true });
            renewToken(res);
            this.refreshTimer = timer(res.refresh_expires_in).subscribe(() => {
                this.login();
            });
        });
    }
}
