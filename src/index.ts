/*
 * Copyright (C)2018 medozs and/or its affiliates
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
import { HttpClient } from "@angular/common/http";
import { Subscription } from "rxjs";
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
    constructor(private http: HttpClient ) {}
    private accessToken: string;
    private refreshToken: string;
    private accessTimer: Subscription;
    private refreshTimer: Subscription;
    private _isAuthenticated: boolean;
    private options = {
        headers: new HttpHeaders().set("Content-Type", "application/x-www-form-urlencoded")
    };
    private readonly REDIRECTDEFAULT = "app";
    private readonly DELAYTIMEDEFAULT = 10 * 1000;
    private _config: Config;
    set config(config: Config) {
        this._config = config;
        if (!this._config.REDIRECT) {this._config.REDIRECT = this.REDIRECTDEFAULT; }
        if (!this._config.DELAYTIME) {this._config.DELAYTIME = this.DELAYTIMEDEFAULT; }
    }
    get config() {
        return this._config;
    }

    public authenticated() {
        return this._isAuthenticated;
    }

    public getToken() {
        return this.accessToken;
    }

    public getUser(): Observable<Object> {
        return this.http.get(`${this.config.openIdConfig.userinfo_endpoint}`);
    }

    public login(): string {
        this.reset();
        return `${this.config.openIdConfig.authorization_endpoint}?client_id=${this.config.clientId}&redirect_uri=${this.config.REDIRECT}&response_type=code&scope=openid+email+profile`;
    }
    public logout(): string {
        this.reset();
        return  `${this.config.openIdConfig.end_session_endpoint}?redirect_uri=${this.config.REDIRECT}`;
    }

    private reset() {
        this.accessToken = null;
        this.refreshToken = null;
        this._isAuthenticated = false;
        if (this.refreshTimer) { this.refreshTimer.unsubscribe(); }
        if (this.accessTimer) { this.accessTimer.unsubscribe(); }
    }
    private renewToken (res) {
        this.accessTimer = timer((res.expires_in * 1000) - this.config.DELAYTIME).subscribe(() => {
            this.http.post(`${this.config.openIdConfig.token_endpoint}`,
            `client_id=${this.config.clientId}&client_secret=${this.config.clientSecret}&redirect_uri=${this.config.REDIRECT}&grant_type=refresh_token&refresh_token=${this.refreshToken}`,
            this.options).map(res2 => <IToken>res2).subscribe(res2 => {
                this.accessToken = res2.access_token;
                this.refreshToken = res2.refresh_token;
                this.renewToken(res2);
            }, (err) => this.login());
        }, (err) => console.error(err));
    }
    public init(code ?: string) {
        this.reset();
        this.http.post(`${this.config.openIdConfig.token_endpoint}`,
        `client_id=${this.config.clientId}&client_secret=${this.config.clientSecret}&redirect_uri=${this.config.REDIRECT}&grant_type=authorization_code&code=${code}`,
        this.options).map(res => <IToken>res).subscribe(res => {
            this.accessToken = res.access_token;
            this.refreshToken = res.refresh_token;
            this._isAuthenticated = true;
            this.config.homeRoute();
            this.renewToken(res);
        }, (err) => console.error(err));
    }
}

interface IToken {
    "access_token": string;
    "expires_in": string;
    "refresh_expires_in": string;
    "refresh_token": string;
    "token_type": string;
    "id_token": string;
    "not-before-policy": string;
    "session_state": string;
}

export interface Config {
    clientId: string;
    clientSecret: string;
    authRoute: () => void;
    homeRoute: ()=> void;
    REDIRECT?: string;
    DELAYTIME?: number;
    openIdConfig: OpenIdConfig;
}

export interface OpenIdConfig {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    token_introspection_endpoint: string;
    userinfo_endpoint: string;
    end_session_endpoint: string;
    [x: string]: any;
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token = `Bearer ${this.authService.getToken()}`;
    req = req.clone({
      setHeaders: {
        Authorization: token
      }
    });
    return next.handle(req);
  }
}
