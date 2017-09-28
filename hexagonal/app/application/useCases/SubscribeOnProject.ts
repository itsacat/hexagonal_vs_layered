class SubscribeOnProject {
    public static async subscribeOrRestoreSubscription(
            userId, projectId, amount, successRedirectURL, failureRedirectURL
        ) {
        const project: Project = await ProjectRepository.getById(projectId);
        const user: User = await UserRepository.getById(userId);

        let subscription: Subscription =
            await user.getSubscriptionByProject(project);

        if (subscription) {
            await user.restoreSubscription(subscription, amount);
        } else {
            subscription = await user.subscribe(project, amount);
        }

        await SubscriptionRepository.save(subscription);

        if (subscription.status == 'waitingForFirstOrder') {
            await this.payFirstOrder(
                subscription, successRedirectURL, failureRedirectURL
            );
        } else if (subscription.status == 'waitingForRecurrentOrder') {
            await this.payRecurrentOrder(subscription);
        }

        return subscription;
    }


    private static async payFirstOrder(
            subscription, successRedirectURL, failureRedirectURL
        ) {
        let order: FirstOrder =
            await OrderFactory.createFirstOrderBySubscription(subscription);

        try {
            await order.makePaymentInAcquiring(
                successRedirectURL, failureRedirectURL
            );
        } catch (error) {
            if (error instanceof CreationOfAcquiringOrderFailedError) {
                await OrderRepository.save(order);
                // Тут конечно можно создать эррор уровня use case, но это зашквар.
                throw error;
            } else {
                throw error;
            }
        }

        await OrderRepository.update(order);
    }


    public static async payRecurrentOrder(subscription) {
        let order: RecurrentOrder =
            await OrderFactory.createRecurrentBySubscription(subscription);

        try {
            await order.makePaymentInAcquiring(
                successRedirectURL, failureRedirectURL
            );
        } catch (error) {
            if (error instanceof PaymentError) {
                await OrderRepository.save(order);
                // Тут конечно можно создать эррор уровня use case, но это зашквар.
                throw error;
            } else {
                throw error;
            }
        }

        await OrderRepository.update(order);
    }


    public static async creationAcquiringOrderCallback(order) {
        await order.readAcquiringOrderData();
        OrderRepository.save(order);
    }


    public static async onFirstOrderPaid(order) {
        let user = UserRepository.getUserByOrder(order.id);
        user.createCardByOrder(order);
        UserRepository.save(user);


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


    public static async onRecurrentOrderPaid(order) {
        let subscription =
            SubscriptionRepository.getById(order.subscriptionId);
        subscription.enable();
        SubscriptionRepository.save(subscription);

        // Спросить у продуктологов: Нужно ли высылать email?
    }


    public static async onUserSubscribed(subscription) {
        let project = ProjectRepository.getById(subscription.projectId);
        let user = UserRepository.getById(subscription.userId);

        if (user.isOwnerOfProject(project)) {
            project.enable();
            ProjectPepository.save(project);
        }
    }
}
