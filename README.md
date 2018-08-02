# OAUTH2/OIDC Client

[Universal OAUTH2/OpenID Connect Client library](https://www.npmjs.com/package/oauth2-oidc-client)

## Installation: 
`npm install oauth2-oidc-client --save`

## Usage

### auth.ts (Angular NativeScript)

    import { Component, OnInit } from "@angular/core";
    import { RouterExtensions, PageRoute } from "nativescript-angular/router";
    import * as webViewModule from "tns-core-modules/ui/web-view";
    import * as url from "urlparser";
    import { AuthService } from "oauth2-oidc-client";
    import { timer } from "rxjs/observable/timer";
    import { map, filter, switchMap, timeout } from "rxjs/operators";
    import "rxjs/add/operator/switchMap";
    @Component({
        moduleId: module.id,
        template: // html
        `
        <ActivityIndicator row="1" #activityIndicator [busy]="loading" width="100" height="100" class="activity-indicator"></ActivityIndicator>
        <WebView
            visibility="{{ !loading ? 'visible' : 'collapsed' }}"
            [src]="authURL"
            (loadStarted)="loadStarted($event)"></WebView>
        `
    })
    export class AuthComponent implements OnInit {
        public authURL;
        public loading: boolean = true;
        public constructor(
            private router: RouterExtensions,
            private pageRoute: PageRoute,
            private authService: AuthService) {
                this.authService.config = {
                    authRoute: () => {
                        this.router.navigate([""], { clearHistory: true });
                    },
                    homeRoute: () => {
                        this.router.navigate(["/home"], { clearHistory: true });
                    },
                    clientId: "...",
                    clientSecret: "...",
                    // username: "?...",
                    // password: "?...",
                    // REDIRECT: "?...",
                    // SCOPE: "openid+email+profile", // default
                    // state: Math.random().toString(36).substring(7),
                    // nonce: "?...",
                    oauth2Config: {
                        "issuer": "...",
                        "authorization_endpoint": "...",
                        "token_endpoint": "...",
                        "token_introspection_endpoint": "...",
                        "userinfo_endpoint": "...",
                        "end_session_endpoint": "..."
                    }
                };
        }

        // authorization_code login authentication
        public ngOnInit() {
            this.pageRoute.activatedRoute
            .switchMap(activatedRoute => activatedRoute.queryParams)
            .forEach((params) => {
                let action = params["action"];
                if (action == null || action === "login") {
                    this.login();
                } else if (action === "logout") {
                    this.logout();
                }
                });
        }

        private parseURLData(urlstr) {
            let parsedURL = url.parse(urlstr);
            let code = parsedURL.query ? parsedURL.query.params["code"] : null;
            let state = parsedURL.query ? parsedURL.query.params["state"] : null;
            let nonce = parsedURL.query ? parsedURL.query.params["nonce"] : null;
            let redirectName = parsedURL.path.base;
            if (code && redirectName.match(`\\w*/?${this.authService.config.REDIRECT}`)) {
                return {code, state, nonce};
            } else {
                return null;
            }
        }

        public login() {
            this.authURL = this.authService.login();
            timer(1000).subscribe(x => { this.loading = false; });
        }

        public logout() {
            this.loading = true;
            this.authURL = this.authService.logout();
            timer(1000).subscribe(x => this.login());
        }

        public getUser() {
            this.authService.getUser().subscribe(x => console.log(JSON.stringify(x)));
        }

        public loadStarted(e: webViewModule.LoadEventData) {
            let authData = this.parseURLData(e.url);
            if (authData && authData.state === this.authService.config.state) {
                this.loading = true;
                this.authURL = "";
                this.authService.init(authData.code); //  null for password grant
            }
        }
    }

    import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
    import { NativeScriptRouterModule } from "nativescript-angular/router";
    import { NativeScriptCommonModule } from "nativescript-angular/common";
    import { NativeScriptFormsModule } from "nativescript-angular/forms";
    import { Route } from "@angular/router";

    export const routerConfig: Route[] = [
        {
            path: "",
            component: AuthComponent
        }
    ];
    @NgModule({
        schemas: [NO_ERRORS_SCHEMA],
        imports: [
            NativeScriptFormsModule,
            NativeScriptCommonModule,
            NativeScriptRouterModule,
            NativeScriptRouterModule.forChild(routerConfig)
        ],
        declarations: [AuthComponent]
    })

    export class AuthModule {
        constructor() { }
    }

  
### auth.ts (Angular Web)
    
    declare var document;
    import { Component, OnInit } from "@angular/core";
    import { Router } from "@angular/router";
    import * as url from "urlparser";
    import { AuthService } from "oauth2-oidc-client";
    import { timer } from "rxjs/observable/timer";
    import "rxjs/add/operator/switchMap";

    @Component({
        moduleId: module.id,
        template: // html
        `
        <style>
            .icon-moon {
                font-family: "icomoon";
            }
            @keyframes rotating {
                from {
                transform: rotate(0deg);
                }
                to {
                transform: rotate(360deg);
                }
            }
            .rotating {
                animation: rotating 2s linear infinite;
            }
        </style>
        <Label
            visibility="{{ loading ? 'visible' : 'collapsed' }}"
            class="icon-moon rotating"
            innerText=""
            style="
            font-size: 30;
            display: inline-block;
            position: absolute;
            top:50%;
            left:50%;">
        </Label>
        `
    })
    export class AuthComponent implements OnInit {
        public authURL;
        public loading: boolean = true;
        public constructor(
            private router: Router,
            private pageRoute: ActivatedRoute,
            private authService: AuthService) {
                this.authService.config = {
                    authRoute: () => {
                        this.router.navigate([""], { clearHistory: true });
                    },
                    homeRoute: () => {
                        this.router.navigate(["/home"], { clearHistory: true });
                    },
                    clientId: "...",
                    clientSecret: "...",
                    // username: "?...",
                    // password: "?...",
                    REDIRECT: window.location.href,
                    // SCOPE: "openid+email+profile", // default
                    // state: Math.random().toString(36).substring(7),
                    // nonce: "?...",
                    oauth2Config: {
                        "issuer": "...",
                        "authorization_endpoint": "...",
                        "token_endpoint": "...",
                        "token_introspection_endpoint": "...",
                        "userinfo_endpoint": "...",
                        "end_session_endpoint": "..."
                    }
                };
        }

        // authorization_code login authentication
        public ngOnInit() {
            this.pageRoute.activatedRoute
            .switchMap(activatedRoute => activatedRoute.queryParams)
            .forEach((params) => {
                let action = params["action"];
                if (action == null || action === "login") {
                    let authData = this.parseURLData(window.location.href);
                    if (authData && authData.state === this.authService.config.state) {
                        this.loading = true;
                        this.authURL = "";
                        this.authService.init(authData.code); //  null for password grant
                    } else { 
                        this.login();
                    }
                } else if (action === "logout") {
                    this.logout();
                }
                });
        }

        private parseURLData(urlstr) {
            let parsedURL = url.parse(urlstr);
            let code = parsedURL.query ? parsedURL.query.params["code"] : null;
            let state = parsedURL.query ? parsedURL.query.params["state"] : null;
            let nonce = parsedURL.query ? parsedURL.query.params["nonce"] : null;
            let redirectName = parsedURL.path.base;
            if (code && redirectName.match(`\\w*/?${this.authService.config.REDIRECT}`)) {
                return {code, state, nonce};
            } else {
                return null;
            }
        }

        public login() {
            window.location.href = this.authService.login();
            timer(1000).subscribe(x => { this.loading = false; });
        }

        public logout() {
            this.loading = true;
            window.location.href = this.authService.logout();
            timer(1000).subscribe(x => this.login());
        }

        public getUser() {
            this.authService.getUser().subscribe(x => console.log(JSON.stringify(x)));
        }        
    }

    import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
    import { RouterModule } from "@angular/router";
    import { CommonModule } from "@angular/common";
    import { FormsModule } from "@angular/forms";
    import { Route } from "@angular/router";

    export const routerConfig: Route[] = [
        {
            path: "",
            component: AuthComponent
        }
    ];
    @NgModule({
        schemas: [NO_ERRORS_SCHEMA],
        imports: [
            FormsModule,
            CommonModule,
            RouterModule,
            RouterModule.forChild(routerConfig)
        ],
        declarations: [AuthComponent]
    })

    export class AuthModule {
        constructor() { }
    }


### app.module.ts (Angular)

    ...
    import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
    import { AuthService } from "oauth2-oidc-client";

    import {
        HttpRequest,
        HttpHandler,
        HttpEvent,
        HttpInterceptor,
        HttpHeaders
    } from "@angular/common/http;
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

    @NgModule({
        schemas: [...],
        declarations: [
            ...,
        ],
        bootstrap: [..],
        imports: [
            ...,
        ],
        providers: [
            AuthService,
            {
                provide: HTTP_INTERCEPTORS,
                useClass: AuthInterceptor,
                multi: true
            }
        ]
    })
    export class AppModule { }
    ...

# Auth.js (Web)

    const authService = new (require("oauth2-oidc-client").AuthService)();
    authService.config = {...}
    authService.init(/*code*/);
    var token = authService.getToken();
    ...........

## Notes:

    Please setup the Redirect Condition OAuth2/OpenID setting to equal "*" (Any)  



Copyright (C)2018 @medozs Apache-2.0 License  