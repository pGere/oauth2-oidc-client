# Nativescript OpenID

OpenID connect library for Nativescript

## Installation: 
`npm install nativescript-openid --save`

## Using

### login.component.ts
`import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { HttpClient } from "@angular/common/http";
import * as webViewModule from "tns-core-modules/ui/web-view";
import * as url from "urlparser";
import { AuthService } from "../services/auth.service";

@Component({
    moduleId: module.id,
    templateUrl: "login.component.html"
})
export class LoginComponent implements OnInit {
    public constructor(
        private router: RouterExtensions,
        private http: HttpClient,
        private authService: AuthService) {
            this.authService.config = {
                loginRoute: "",
                homeRoute: "...",
                host: "https://...,
                clientId: "id...",
                clientSecret: "secret..."
            };
    }
    private authURL;
    private logedIn;
    public loadStarted(e: webViewModule.LoadEventData) {
        let parsedURL = url.parse(e.url);
        let code = parsedURL.query.params["code"];
        let redirectName = parsedURL.path.base;
        if (code && redirectName === "auth/app") {
            this.authService.init(code);
            this.logedIn = true;
        }
    }

    public ngOnInit() {
       if (!this.authService.authenticated()) {
            this.authURL = `${this.authService.config.host}/auth/realms/public/protocol/openid-connect/auth?client_id=${this.authService.config.clientId}&redirect_uri=app&response_type=code&scope=openid+email+profile`;
            this.logedIn = false;
        } else {
            this.logedIn = true;
            this.router.navigate([this.authService.config.homeRoute], { clearHistory: true });
        }
    }
}
`

### login.component.html
<GridLayout backgroundColor="#CCCCCC">
    <ScrollView>
        <WebView
        [Visibility]="!logedIn"
        [src]="authURL"
        (loadStarted)="loadStarted($event)"></WebView>
    </ScrollView>
</GridLayout>`

### app.module.ts
...
`import { AuthService, AuthInterceptor } from "./services/auth.service";

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
`

## Notes:
Please setup the Redirect Condition OpenID setting to equal "*" (Any)  



Copyright (C)2018 @medozs Apache-2.0 License  