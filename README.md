# Angular OIDC Client

Universal OpenID Connect Client library for Angular

## Installation: 
`npm install nangular-oidc-client --save`

## Usage

### auth.ts (NativeScript)
    import { Component, OnInit } from "@angular/core";
    import { RouterExtensions, PageRoute } from "nativescript-angular/router";
    import { HttpClient } from "@angular/common/http";
    import * as webViewModule from "tns-core-modules/ui/web-view";
    import * as url from "urlparser";
    import { AuthService } from "angular-oidc-client";
    import { Settings } from "../data.model";
    import { timer } from "rxjs/observable/timer";


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
            text=""
            textWrap="true"
            class="icon-moon rotating"
            verticalAlignment="middle"
            style="font-size: 30; display: inline-block;"
            horizontalAlignment="center">
        </Label>
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
            private http: HttpClient,
            private authService: AuthService,
            private settings: Settings) {
                this.authService.config = {
                    authRoute: () => {
                        this.router.navigate([""], { clearHistory: true });
                    },
                    homeRoute: () => {
                        this.router.navigate(["/home"], { clearHistory: true });
                    },
                    clientId: "...",
                    clientSecret: "...",
                    openIdConfig: {
                        "issuer": "...",
                        "authorization_endpoint": "...",
                        "token_endpoint": "...",
                        "token_introspection_endpoint": ...",
                        "userinfo_endpoint": "...",
                        "end_session_endpoint": "..."
                    }
                };
        }

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

        private parseURLCode(urlstr) {
            let parsedURL = url.parse(urlstr);
            let code = parsedURL.query ? parsedURL.query.params["code"] : null;
            let redirectName = parsedURL.path.base;
            if (code && redirectName.match(`\\w+/${this.authService.config.REDIRECT}`)) {
                return code;
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
            let authCode = this.parseURLCode(e.url);
            if (authCode) {
                this.loading = true;
                this.authURL = "";
                this.authService.init(authCode);
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
  

### app.module.ts
    ...
    import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
    import { AuthService, AuthInterceptor } from "angular-oidc-client";

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


## Notes:
Please setup the Redirect Condition OpenID setting to equal "*" (Any)  



Copyright (C)2018 @medozs Apache-2.0 License  