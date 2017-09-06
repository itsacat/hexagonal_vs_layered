class SubscribeOnProject {
    // ОБРАТИТЕВНИВАНИЕ: в SubscribeOnProject есть 2 юзкейса: subscribe и restoreSubscription
    // Я их положил в один файл SubscribeOnProject потому, что у них разные
    // точки входа но дальше код одинаковый.

    // ОБРАТИТЕВНИВАНИЕ: Я думаю что use case может принимать либо сущности, либо id для сущностей.
    // Просто делать как производительней, а потом если что, делать перегрузку.
    public static async subscribe(
            user, project, amount, successRedirectURL, failureRedirectURL
        ) {
        // ОБРАТИТЕВНИВАНИЕ: Мы перестали прокидывать в subscribe параметры
        // successRedirectURL, failureRedirectURL
        let subscription = await user.subscribe(project, amount);

        await SubscriptionRepository.save(subscription);

        // ОБРАТИТЕВНИВАНИЕ: Вместо ифов правильней было бы бросать события
        // waitingForFirstOrder и waitingForRecurrentOrder, но
        // нам нужено результат выполнения PaymentOfFirstOrder.paymentOfFirstOrder()
        // выплюнуть на верх в контроллер. Поэтому сделал ифы.
        // Опять же если класть urlForFirstPayment в Subscription, можно
        // переписать ифы на события, и в контроллере брать urlForFirstPayment из Subscription.
        if (subscription.status == 'waitingForFirstOrder') {
            let urlForFirstPayment = await PaymentOfFirstOrder.paymentOfFirstOrder(
                subscription, successRedirectURL, failureRedirectURL
            );
            return urlForFirstPayment;
        } else if (subscription.status == 'waitingForRecurrentOrder') {
            await PaymentOfRecurrentOrder.paymentOfRecurrentOrder(subscription);
        }
    }


    public static async restoreSubscription(
            subscription, amount, successRedirectURL, failureRedirectURL
        ) {
        await user.restoreSubscription(subscription, amount);

        await SubscriptionRepository.save(subscription);

        if (subscription.status == 'waitingForFirstOrder') {
            let urlForFirstPayment = await PaymentOfFirstOrder.paymentOfFirstOrder(
                subscription, successRedirectURL, failureRedirectURL
            );
            return urlForFirstPayment;
        } else if (subscription.status == 'waitingForRecurrentOrder') {
            await PaymentOfRecurrentOrder.paymentOfRecurrentOrder(subscription);
        }
    }


    // ОБРАТИТЕВНИВАНИЕ: я вынес эту бизнес логику в use case
    public static async onFirstOrderPaid(order) {
        let subscription =
            SubscriptionRepository.getById(order.subscriptionId);
        subscription.enable();
        SubscriptionRepository.save(subscription);

        if (user.isNotificationsLevelIsAll) {
            mail.sendFirstPayment(user.email, {
                userId: user.id,
                userName: user.firstName
            });
        }
    }


    // ОБРАТИТЕВНИВАНИЕ: я вынес эту бизнес логику в use case
    public static async onRecurrentOrderPaid(order) {
        let subscription =
            SubscriptionRepository.getById(order.subscriptionId);
        subscription.enable();
        SubscriptionRepository.save(subscription);

        // Спросить у продуктологов: Нужно ли высылать email?
    }


    // ОБРАТИТЕВНИВАНИЕ: я вынес эту бизнес логику в use case
    public static async onUserSubscribed(subscription) {
        let project = ProjectRepository.getById(subscription.projectId);
        let user = UserRepository.getById(subscription.userId);

        if (user.isOwnerOfProject(project)) {
            project.enable();
            ProjectPepository.save(project);
        }
    }
}
