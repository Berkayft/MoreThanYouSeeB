import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "../auth.service";
import { ExecutionContext, Injectable } from "@nestjs/common";



@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    await super.canActivate(context);
    await this.authService.login(request.user);
    return true;
  }
}