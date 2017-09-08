// @pslotinsky
// 1. Вообще это достаточно странное использование Ports-And-Adapters архитектуры :)
// Учитывая, что здесь нет ни портов, ни адаптеров. А если бы ои были, то
// UseCase-слой уехал бы в доменную область, и ни у кого не было бы претензий, что
// в нем выполняется логика. Собственно UseCase-слой и предназначен для логики приложения,
// а не просто ввода-вывода
// 2. Возможно стоит подумать над реализацией UseCase-классов через паттерн "Комманда".
// Для того, чтобы у них был метод undo на случай неудачи

class SubscribeOnProject {
    // @pslotinsky Раздражает, что класс назван, как действие.
    // ИМХО правильней SubscriptionOnProject, либо SubscribeOnProjectUseCase
    // ОБРАТИТЕВНИВАНИЕ: в SubscribeOnProject есть 2 юзкейса: subscribe и restoreSubscription
    // Я их положил в один файл SubscribeOnProject потому, что у них разные
    // точки входа но дальше код одинаковый.
    // @pslotinsky
    // Возможно стоило в юз-кейс вынести логику с проверкой существования подписки.
    // Тогда не было бы 2-ух точек входа

    // ОБРАТИТЕВНИВАНИЕ: Я думаю что use case может принимать либо сущности, либо id для сущностей.
    // Просто делать как производительней, а потом если что, делать перегрузку.
    // @pslotinsky Мне кажется странным, что мы работаем с репозиториями и в контроллерах и в юз-кейсах
    // по-моему логичней оставить только юз-кейсы
    public static async subscribe(
            user, project, amount, successRedirectURL, failureRedirectURL
        ) {
        // ОБРАТИТЕВНИВАНИЕ: Мы перестали прокидывать в subscribe параметры
        // successRedirectURL, failureRedirectURL
        // @pslotinsky
        // Если использовать DI, то можно было бы создать 2 контейнера зависимостей:
        // для кордовы и без, и прокидывать через них какой-нибудь UrlBuilder.
        // Соответственно сигнатура метода сократилась бы до:
        // (userId, projectId, paymentType, amount), что гораздо лучше отображает
        // суть происходящего
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
            // @pslotinsky Вообще return внутри if - это не оч круто.
            // Вдвойне не круто, что по else не возвращается ничего
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
