# Nativescript OpenID

OpenId Connect library for Nativescript

## Installation: 
`npm install nativescript-openid --save`

## Usage

### auth.component.ts
    import { Component, OnInit } from "@angular/core";
    import { RouterExtensions } from "nativescript-angular/router";
    import { HttpClient } from "@angular/common/http";
    import * as webViewModule from "tns-core-modules/ui/web-view";
    import * as url from "urlparser";
    import { AuthService } from "nativescript-openid";

    @Component({
        moduleId: module.id,
        templateUrl: "auth.component.html"
    })
    export class AuthComponent implements OnInit {
        private authURL;
        private logedIn?: boolean;
        public constructor(
            private router: RouterExtensions,
            private http: HttpClient,
            private authService: AuthService) {
                this.authService.config = {
                    authRoute: "",
                    homeRoute: "...",
                    clientId: "...",
                    clientSecret: "...",
                    openIdConfig: {
                        "issuer": "...",
                        "authorization_endpoint": "...",
                        "token_endpoint": "...",
                        "userinfo_endpoint": "...",
                        "end_session_endpoint": "..."
                    }
                };
        }

        public ngOnInit() {
            this.login();
        }

        public loadStarted(e: webViewModule.LoadEventData) {
            let parsedURL = url.parse(e.url);
            let code = parsedURL.query.params["code"];
            let redirectName = parsedURL.path.base;
            if (code && redirectName === `auth/${this.authService.config.REDIRECT}`) {
                this.logedIn = true;
                this.authService.init(code);
            }
        }

        public login() {
            this.authURL = this.authService.login();
        }

        public logout() {
            this.authURL = this.authService.logout();
        }

        public getUser() {
            this.authService.getUser().subscribe(x => console.log(x));
        }
    }

### auth.component.html
    <GridLayout backgroundColor="#CCCCCC">
        <ScrollView>
            <WebView
            [Visibility]="!logedIn"
            [src]="authURL"
            (loadStarted)="loadStarted($event)"></WebView>
        </ScrollView>
    </GridLayout>

### app.module.ts
    ...
    import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
    import { AuthService, AuthInterceptor } from "nativescript-openid";

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