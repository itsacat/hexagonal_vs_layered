import { Container } from "inversify";
import { Notifier, UrlBuilder } from "../lib";
import {
    UserRepository,
    ProjectRepository,
    SubscriptionRepository
} from "../repositories";

const ioc = new Container();
ioc.bind<UserRepository>('UserRepository').to(UserRepository);
ioc.bind<ProjectRepository>('ProjectRepository').to(ProjectRepository);
ioc.bind<SubscriptionRepository>('SubscriptionRepository')
    .to(SubscriptionRepository);
ioc.bind<Notifier>('Notifier').to(Notifier);
ioc.bind<UrlBuilder>('UrlBuilder').to(UrlBuilder);

export { ioc };
