class Subscription {
    public enable() {
        if (!this.enabled) {
            this.enabled = true;
            this.setPayDate(new Date());
            // Бросается событие UserSubscribed
        }
    }
}
