export const translations = {
  en: {
    // Common
    app_name: "Kids Routine",
    today: "Today",
    balance: "Balance",
    coins: "coins",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    back: "Back",
    done: "Done!",
    loading: "Loading...",
    
    // Navigation
    nav_dashboard: "Dashboard",
    nav_children: "Children",
    nav_tasks: "Tasks",
    nav_schedule: "Plan",
    nav_store: "Store",
    nav_job_board: "Tasks",
    nav_reports: "Reports",
    nav_today: "Today",
    nav_goals: "Goals",
    nav_overview: "Overview",
    
    // Roles
    role_parent: "Parent",
    role_child: "Child",
    switch_role: "Switch Role",
    
    // Task States
    state_todo: "To Do",
    state_doing: "In Progress",
    state_done: "Completed",
    
    // Dashboard
    dashboard_title: "Family Dashboard",
    tasks_completed_today: "Tasks completed today",
    earned_today: "Earned today",
    
    // Child View
    hello: "Hello",
    your_tasks: "Your Tasks",
    great_job: "Great job!",
    keep_going: "Keep going!",
    no_tasks: "No tasks for today!",
    
    // Store
    store_title: "Store",
    buy: "Buy",
    not_enough: "Not enough coins",
    coins_to_go: "coins to go",
    purchased: "Purchased!",
    
    // Tasks (Extra)
    job_board_title: "Tasks",
    take_job: "Take Task",
    job_taken: "Task taken!",
    extra_tasks: "Extra tasks for rewards",
    
    // Schedule
    schedule_title: "My Schedule",
    no_activities: "No activities scheduled",
    
    // Parent
    manage_family: "Manage Family",
    add_child: "Add Child",
    add_task: "Add Task",
    add_store_item: "Add Store Item",
    add_job: "Add Job",
  },
  ru: {
    // Common
    app_name: "Детская Рутина",
    today: "Сегодня",
    balance: "Баланс",
    coins: "монет",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Редактировать",
    add: "Добавить",
    back: "Назад",
    done: "Готово!",
    loading: "Загрузка...",
    
    // Navigation
    nav_dashboard: "Главная",
    nav_children: "Дети",
    nav_tasks: "Задания",
    nav_schedule: "План",
    nav_store: "Магазин",
    nav_job_board: "Задания",
    nav_reports: "Отчёты",
    nav_today: "Сегодня",
    nav_goals: "Цели",
    nav_overview: "Обзор",
    
    // Roles
    role_parent: "Родитель",
    role_child: "Ребёнок",
    switch_role: "Сменить роль",
    
    // Task States
    state_todo: "Сделать",
    state_doing: "В процессе",
    state_done: "Выполнено",
    
    // Dashboard
    dashboard_title: "Семейная панель",
    tasks_completed_today: "Задач выполнено сегодня",
    earned_today: "Заработано сегодня",
    
    // Child View
    hello: "Привет",
    your_tasks: "Твои задачи",
    great_job: "Отличная работа!",
    keep_going: "Продолжай!",
    no_tasks: "На сегодня задач нет!",
    
    // Store
    store_title: "Магазин",
    buy: "Купить",
    not_enough: "Не хватает монет",
    coins_to_go: "монет до покупки",
    purchased: "Куплено!",
    
    // Tasks (Extra)
    job_board_title: "Задания",
    take_job: "Взять задание",
    job_taken: "Задание взято!",
    extra_tasks: "Дополнительные задания за награды",
    
    // Schedule
    schedule_title: "Моё расписание",
    no_activities: "Нет запланированных занятий",
    
    // Parent
    manage_family: "Управление семьёй",
    add_child: "Добавить ребёнка",
    add_task: "Добавить задачу",
    add_store_item: "Добавить товар",
    add_job: "Добавить задание",
  }
};

export type Language = 'en' | 'ru';
export type TranslationKey = keyof typeof translations.en;
