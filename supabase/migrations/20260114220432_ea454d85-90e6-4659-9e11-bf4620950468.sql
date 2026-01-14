-- A) Add parent_activities_enabled to profiles for per-user control
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS parent_activities_enabled boolean NOT NULL DEFAULT false;

-- C) Add color column to children for calendar item colors
ALTER TABLE public.children
ADD COLUMN IF NOT EXISTS color text DEFAULT '#3B82F6';

-- C) Add activity_color to profiles for adult activity colors
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS activity_color text DEFAULT '#8B5CF6';

-- B) Create icon_library table for expanded icons
CREATE TABLE IF NOT EXISTS public.icon_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  emoji text NOT NULL,
  name_en text NOT NULL,
  name_ru text NOT NULL,
  tags_en text[] DEFAULT '{}',
  tags_ru text[] DEFAULT '{}',
  category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on icon_library
ALTER TABLE public.icon_library ENABLE ROW LEVEL SECURITY;

-- Icon library is public read for all authenticated users
CREATE POLICY "Authenticated users can view icons"
ON public.icon_library
FOR SELECT
TO authenticated
USING (true);

-- Insert expanded icon library with categories
INSERT INTO public.icon_library (key, emoji, name_en, name_ru, tags_en, tags_ru, category) VALUES
-- HOME category
('bed', '🛏️', 'Bed', 'Кровать', '{"bed","sleep","bedroom"}', '{"кровать","спать","спальня"}', 'home'),
('house', '🏠', 'House', 'Дом', '{"house","home"}', '{"дом","жильё"}', 'home'),
('door', '🚪', 'Door', 'Дверь', '{"door","entrance"}', '{"дверь","вход"}', 'home'),
('couch', '🛋️', 'Couch', 'Диван', '{"couch","sofa","furniture"}', '{"диван","мебель"}', 'home'),
('lamp', '💡', 'Lamp', 'Лампа', '{"lamp","light","bulb"}', '{"лампа","свет"}', 'home'),
('key', '🔑', 'Key', 'Ключ', '{"key","lock"}', '{"ключ","замок"}', 'home'),
('window', '🪟', 'Window', 'Окно', '{"window"}', '{"окно"}', 'home'),
('clock', '🕐', 'Clock', 'Часы', '{"clock","time"}', '{"часы","время"}', 'home'),
('alarm', '⏰', 'Alarm', 'Будильник', '{"alarm","wake","morning"}', '{"будильник","утро"}', 'home'),
('broom', '🧹', 'Broom', 'Метла', '{"broom","clean","sweep"}', '{"метла","уборка"}', 'home'),

-- HYGIENE category
('toothbrush', '🪥', 'Toothbrush', 'Зубная щётка', '{"toothbrush","teeth","dental","brush"}', '{"зубная щётка","зубы"}', 'hygiene'),
('shower', '🚿', 'Shower', 'Душ', '{"shower","bath","wash"}', '{"душ","мыться"}', 'hygiene'),
('bathtub', '🛁', 'Bathtub', 'Ванна', '{"bathtub","bath"}', '{"ванна","купаться"}', 'hygiene'),
('soap', '🧼', 'Soap', 'Мыло', '{"soap","wash","clean"}', '{"мыло","мыть"}', 'hygiene'),
('toilet', '🚽', 'Toilet', 'Туалет', '{"toilet","bathroom"}', '{"туалет","ванная"}', 'hygiene'),
('mirror', '🪞', 'Mirror', 'Зеркало', '{"mirror","reflection"}', '{"зеркало"}', 'hygiene'),
('razor', '🪒', 'Razor', 'Бритва', '{"razor","shave"}', '{"бритва","бриться"}', 'hygiene'),
('lotion', '🧴', 'Lotion', 'Лосьон', '{"lotion","cream","skincare"}', '{"лосьон","крем"}', 'hygiene'),
('comb', '💇', 'Hair', 'Причёска', '{"hair","comb","haircut"}', '{"волосы","причёска"}', 'hygiene'),
('hand_wash', '🧤', 'Hand wash', 'Мытьё рук', '{"hand","wash","hygiene"}', '{"руки","мыть"}', 'hygiene'),

-- FOOD category
('cooking', '🍳', 'Cooking', 'Готовка', '{"cooking","kitchen","frying"}', '{"готовка","кухня"}', 'food'),
('plate', '🍽️', 'Plate', 'Тарелка', '{"plate","dish","meal"}', '{"тарелка","еда"}', 'food'),
('apple', '🍎', 'Apple', 'Яблоко', '{"apple","fruit","healthy"}', '{"яблоко","фрукт"}', 'food'),
('banana', '🍌', 'Banana', 'Банан', '{"banana","fruit"}', '{"банан","фрукт"}', 'food'),
('carrot', '🥕', 'Carrot', 'Морковь', '{"carrot","vegetable"}', '{"морковь","овощ"}', 'food'),
('broccoli', '🥦', 'Broccoli', 'Брокколи', '{"broccoli","vegetable","healthy"}', '{"брокколи","овощ"}', 'food'),
('bread', '🍞', 'Bread', 'Хлеб', '{"bread","bakery"}', '{"хлеб","выпечка"}', 'food'),
('milk', '🥛', 'Milk', 'Молоко', '{"milk","dairy","drink"}', '{"молоко","молочное"}', 'food'),
('water', '💧', 'Water', 'Вода', '{"water","drink","hydration"}', '{"вода","пить"}', 'food'),
('juice', '🧃', 'Juice', 'Сок', '{"juice","drink","beverage"}', '{"сок","напиток"}', 'food'),
('cookie', '🍪', 'Cookie', 'Печенье', '{"cookie","sweet","snack"}', '{"печенье","сладкое"}', 'food'),
('cake', '🎂', 'Cake', 'Торт', '{"cake","birthday","dessert"}', '{"торт","десерт"}', 'food'),
('pizza', '🍕', 'Pizza', 'Пицца', '{"pizza","food"}', '{"пицца","еда"}', 'food'),
('salad', '🥗', 'Salad', 'Салат', '{"salad","healthy","vegetable"}', '{"салат","здоровое"}', 'food'),
('sandwich', '🥪', 'Sandwich', 'Бутерброд', '{"sandwich","lunch"}', '{"бутерброд","обед"}', 'food'),

-- SCHOOL/STUDY category
('book', '📚', 'Books', 'Книги', '{"book","read","study","library"}', '{"книги","чтение","учёба"}', 'school'),
('pencil', '✏️', 'Pencil', 'Карандаш', '{"pencil","write","draw"}', '{"карандаш","писать"}', 'school'),
('notebook', '📓', 'Notebook', 'Тетрадь', '{"notebook","write","notes"}', '{"тетрадь","заметки"}', 'school'),
('backpack', '🎒', 'Backpack', 'Рюкзак', '{"backpack","bag","school"}', '{"рюкзак","школа"}', 'school'),
('school', '🏫', 'School', 'Школа', '{"school","education"}', '{"школа","образование"}', 'school'),
('graduation', '🎓', 'Graduation', 'Выпускной', '{"graduation","education","cap"}', '{"выпускной","образование"}', 'school'),
('calculator', '🔢', 'Calculator', 'Калькулятор', '{"calculator","math","numbers"}', '{"калькулятор","математика"}', 'school'),
('globe', '🌍', 'Globe', 'Глобус', '{"globe","geography","world"}', '{"глобус","география"}', 'school'),
('microscope', '🔬', 'Microscope', 'Микроскоп', '{"microscope","science","lab"}', '{"микроскоп","наука"}', 'school'),
('computer', '💻', 'Computer', 'Компьютер', '{"computer","laptop","tech"}', '{"компьютер","ноутбук"}', 'school'),
('writing', '📝', 'Writing', 'Письмо', '{"writing","homework","note"}', '{"письмо","домашнее задание"}', 'school'),
('ruler', '📏', 'Ruler', 'Линейка', '{"ruler","measure","geometry"}', '{"линейка","геометрия"}', 'school'),
('abc', '🔤', 'ABC', 'Алфавит', '{"abc","alphabet","letters"}', '{"алфавит","буквы"}', 'school'),

-- SPORTS category
('soccer', '⚽', 'Soccer', 'Футбол', '{"soccer","football","ball","sport"}', '{"футбол","мяч","спорт"}', 'sports'),
('basketball', '🏀', 'Basketball', 'Баскетбол', '{"basketball","ball","sport"}', '{"баскетбол","мяч"}', 'sports'),
('tennis', '🎾', 'Tennis', 'Теннис', '{"tennis","ball","racket"}', '{"теннис","ракетка"}', 'sports'),
('swimming', '🏊', 'Swimming', 'Плавание', '{"swimming","pool","water"}', '{"плавание","бассейн"}', 'sports'),
('running', '🏃', 'Running', 'Бег', '{"running","exercise","jog"}', '{"бег","упражнение"}', 'sports'),
('cycling', '🚴', 'Cycling', 'Велосипед', '{"cycling","bike","bicycle"}', '{"велосипед","кататься"}', 'sports'),
('yoga', '🧘', 'Yoga', 'Йога', '{"yoga","meditation","stretch"}', '{"йога","медитация"}', 'sports'),
('gym', '🏋️', 'Gym', 'Тренажёрный зал', '{"gym","weights","exercise"}', '{"тренажёрка","зал"}', 'sports'),
('skating', '⛸️', 'Skating', 'Катание на коньках', '{"skating","ice","winter"}', '{"коньки","лёд"}', 'sports'),
('skiing', '⛷️', 'Skiing', 'Лыжи', '{"skiing","snow","winter"}', '{"лыжи","снег"}', 'sports'),
('martial_arts', '🥋', 'Martial Arts', 'Единоборства', '{"martial arts","karate","judo"}', '{"единоборства","карате"}', 'sports'),
('dance', '💃', 'Dance', 'Танцы', '{"dance","ballet","dancing"}', '{"танцы","балет"}', 'sports'),
('trophy', '🏆', 'Trophy', 'Трофей', '{"trophy","winner","prize"}', '{"трофей","приз"}', 'sports'),
('medal', '🥇', 'Medal', 'Медаль', '{"medal","gold","first"}', '{"медаль","золото"}', 'sports'),

-- CHORES category
('laundry', '👕', 'Laundry', 'Стирка', '{"laundry","clothes","wash"}', '{"стирка","одежда"}', 'chores'),
('vacuum', '🧹', 'Vacuum', 'Пылесос', '{"vacuum","clean","dust"}', '{"пылесос","чистить"}', 'chores'),
('trash', '🗑️', 'Trash', 'Мусор', '{"trash","garbage","bin"}', '{"мусор","выбросить"}', 'chores'),
('recycle', '♻️', 'Recycle', 'Переработка', '{"recycle","environment","eco"}', '{"переработка","экология"}', 'chores'),
('dishes', '🍽️', 'Dishes', 'Посуда', '{"dishes","wash","kitchen"}', '{"посуда","мыть"}', 'chores'),
('iron', '🧹', 'Iron', 'Глажка', '{"iron","clothes","press"}', '{"глажка","одежда"}', 'chores'),
('garden', '🌱', 'Garden', 'Сад', '{"garden","plant","grow"}', '{"сад","растение"}', 'chores'),
('watering', '💧', 'Watering', 'Полив', '{"watering","plants","garden"}', '{"полив","растения"}', 'chores'),
('organize', '📦', 'Organize', 'Организация', '{"organize","tidy","box"}', '{"организация","порядок"}', 'chores'),
('fold', '👔', 'Fold clothes', 'Сложить одежду', '{"fold","clothes","tidy"}', '{"сложить","одежда"}', 'chores'),
('make_bed', '🛏️', 'Make bed', 'Застелить кровать', '{"make bed","bedroom","morning"}', '{"застелить","кровать","утро"}', 'chores'),

-- FUN category
('game', '🎮', 'Gaming', 'Игры', '{"game","gaming","play","video"}', '{"игра","играть"}', 'fun'),
('puzzle', '🧩', 'Puzzle', 'Пазл', '{"puzzle","game","solve"}', '{"пазл","головоломка"}', 'fun'),
('art', '🎨', 'Art', 'Рисование', '{"art","paint","draw","creative"}', '{"рисование","творчество"}', 'fun'),
('music', '🎵', 'Music', 'Музыка', '{"music","song","listen"}', '{"музыка","песня"}', 'fun'),
('piano', '🎹', 'Piano', 'Пианино', '{"piano","keyboard","music"}', '{"пианино","клавиши"}', 'fun'),
('guitar', '🎸', 'Guitar', 'Гитара', '{"guitar","music","string"}', '{"гитара","музыка"}', 'fun'),
('movie', '🎬', 'Movie', 'Кино', '{"movie","film","watch"}', '{"кино","фильм"}', 'fun'),
('tv', '📺', 'TV', 'Телевизор', '{"tv","television","watch"}', '{"телевизор","смотреть"}', 'fun'),
('balloon', '🎈', 'Balloon', 'Шарик', '{"balloon","party","fun"}', '{"шарик","праздник"}', 'fun'),
('party', '🎉', 'Party', 'Вечеринка', '{"party","celebration"}', '{"вечеринка","праздник"}', 'fun'),
('gift', '🎁', 'Gift', 'Подарок', '{"gift","present","birthday"}', '{"подарок","сюрприз"}', 'fun'),
('teddy', '🧸', 'Teddy Bear', 'Мишка', '{"teddy","bear","toy","stuffed"}', '{"мишка","игрушка"}', 'fun'),
('blocks', '🧱', 'Blocks', 'Кубики', '{"blocks","lego","build"}', '{"кубики","лего","строить"}', 'fun'),
('kite', '🪁', 'Kite', 'Воздушный змей', '{"kite","fly","outdoor"}', '{"змей","летать"}', 'fun'),
('playground', '🛝', 'Playground', 'Площадка', '{"playground","park","play"}', '{"площадка","парк"}', 'fun'),
('reading', '📖', 'Reading', 'Чтение', '{"reading","book","story"}', '{"чтение","книга"}', 'fun'),
('magic', '✨', 'Magic', 'Магия', '{"magic","sparkle","special"}', '{"магия","волшебство"}', 'fun'),
('rainbow', '🌈', 'Rainbow', 'Радуга', '{"rainbow","colorful"}', '{"радуга","цветной"}', 'fun'),

-- PETS category
('dog', '🐕', 'Dog', 'Собака', '{"dog","pet","walk"}', '{"собака","питомец"}', 'pets'),
('cat', '🐈', 'Cat', 'Кошка', '{"cat","pet","kitten"}', '{"кошка","кот","питомец"}', 'pets'),
('fish', '🐠', 'Fish', 'Рыбка', '{"fish","aquarium","pet"}', '{"рыбка","аквариум"}', 'pets'),
('hamster', '🐹', 'Hamster', 'Хомяк', '{"hamster","pet","rodent"}', '{"хомяк","питомец"}', 'pets'),
('rabbit', '🐰', 'Rabbit', 'Кролик', '{"rabbit","bunny","pet"}', '{"кролик","зайчик"}', 'pets'),
('bird', '🐦', 'Bird', 'Птица', '{"bird","parrot","pet"}', '{"птица","попугай"}', 'pets'),
('turtle', '🐢', 'Turtle', 'Черепаха', '{"turtle","pet","slow"}', '{"черепаха","питомец"}', 'pets'),
('paw', '🐾', 'Paw', 'Лапка', '{"paw","pet","print"}', '{"лапка","след"}', 'pets'),
('bone', '🦴', 'Bone', 'Косточка', '{"bone","dog","treat"}', '{"косточка","собака"}', 'pets'),
('leash', '🦮', 'Walk dog', 'Прогулка с собакой', '{"walk","dog","leash"}', '{"прогулка","собака"}', 'pets'),

-- TRAVEL category
('car', '🚗', 'Car', 'Машина', '{"car","drive","vehicle"}', '{"машина","авто"}', 'travel'),
('bus', '🚌', 'Bus', 'Автобус', '{"bus","transport","public"}', '{"автобус","транспорт"}', 'travel'),
('train', '🚆', 'Train', 'Поезд', '{"train","railway","travel"}', '{"поезд","железная дорога"}', 'travel'),
('plane', '✈️', 'Plane', 'Самолёт', '{"plane","airplane","fly"}', '{"самолёт","лететь"}', 'travel'),
('boat', '⛵', 'Boat', 'Лодка', '{"boat","sail","water"}', '{"лодка","парусник"}', 'travel'),
('beach', '🏖️', 'Beach', 'Пляж', '{"beach","sand","vacation"}', '{"пляж","песок","отпуск"}', 'travel'),
('mountain', '🏔️', 'Mountain', 'Гора', '{"mountain","hiking","nature"}', '{"гора","поход"}', 'travel'),
('camping', '🏕️', 'Camping', 'Кемпинг', '{"camping","tent","outdoor"}', '{"кемпинг","палатка"}', 'travel'),
('luggage', '🧳', 'Luggage', 'Багаж', '{"luggage","suitcase","travel"}', '{"багаж","чемодан"}', 'travel'),
('map', '🗺️', 'Map', 'Карта', '{"map","navigation","travel"}', '{"карта","навигация"}', 'travel'),

-- HEALTH category
('doctor', '👨‍⚕️', 'Doctor', 'Доктор', '{"doctor","health","medical"}', '{"доктор","здоровье"}', 'health'),
('medicine', '💊', 'Medicine', 'Лекарство', '{"medicine","pill","health"}', '{"лекарство","таблетка"}', 'health'),
('thermometer', '🌡️', 'Thermometer', 'Термометр', '{"thermometer","temperature","sick"}', '{"термометр","температура"}', 'health'),
('bandage', '🩹', 'Bandage', 'Пластырь', '{"bandage","injury","first aid"}', '{"пластырь","рана"}', 'health'),
('sleep', '😴', 'Sleep', 'Сон', '{"sleep","rest","night"}', '{"сон","отдых","ночь"}', 'health'),
('meditation', '🧘', 'Meditation', 'Медитация', '{"meditation","calm","relax"}', '{"медитация","релакс"}', 'health'),
('heart', '❤️', 'Heart', 'Сердце', '{"heart","love","health"}', '{"сердце","любовь"}', 'health'),
('brain', '🧠', 'Brain', 'Мозг', '{"brain","think","smart"}', '{"мозг","думать"}', 'health'),
('vitamins', '💪', 'Vitamins', 'Витамины', '{"vitamins","strong","health"}', '{"витамины","сила"}', 'health'),

-- OTHER/GENERAL category
('star', '⭐', 'Star', 'Звезда', '{"star","favorite","special"}', '{"звезда","любимое"}', 'other'),
('sparkle', '✨', 'Sparkle', 'Блеск', '{"sparkle","magic","shine"}', '{"блеск","магия"}', 'other'),
('sun', '☀️', 'Sun', 'Солнце', '{"sun","morning","bright"}', '{"солнце","утро"}', 'other'),
('moon', '🌙', 'Moon', 'Луна', '{"moon","night","sleep"}', '{"луна","ночь"}', 'other'),
('check', '✅', 'Check', 'Галочка', '{"check","done","complete"}', '{"галочка","готово"}', 'other'),
('fire', '🔥', 'Fire', 'Огонь', '{"fire","hot","urgent"}', '{"огонь","срочно"}', 'other'),
('lightning', '⚡', 'Lightning', 'Молния', '{"lightning","fast","energy"}', '{"молния","быстро"}', 'other'),
('target', '🎯', 'Target', 'Цель', '{"target","goal","aim"}', '{"цель","достигнуть"}', 'other'),
('bell', '🔔', 'Bell', 'Колокольчик', '{"bell","notification","ring"}', '{"колокольчик","уведомление"}', 'other'),
('calendar', '📅', 'Calendar', 'Календарь', '{"calendar","date","schedule"}', '{"календарь","дата"}', 'other'),
('timer', '⏱️', 'Timer', 'Таймер', '{"timer","stopwatch","time"}', '{"таймер","время"}', 'other'),
('money', '💰', 'Money', 'Деньги', '{"money","coins","reward"}', '{"деньги","монеты"}', 'other'),
('lightbulb', '💡', 'Idea', 'Идея', '{"idea","lightbulb","think"}', '{"идея","лампочка"}', 'other'),
('thumbs_up', '👍', 'Thumbs Up', 'Класс', '{"thumbs up","like","good"}', '{"класс","нравится"}', 'other'),
('clap', '👏', 'Clap', 'Аплодисменты', '{"clap","applause","bravo"}', '{"аплодисменты","браво"}', 'other'),
('crown', '👑', 'Crown', 'Корона', '{"crown","king","queen","royalty"}', '{"корона","король"}', 'other'),
('phone', '📱', 'Phone', 'Телефон', '{"phone","mobile","call"}', '{"телефон","звонок"}', 'other'),
('email', '📧', 'Email', 'Почта', '{"email","mail","message"}', '{"почта","письмо"}', 'other'),
('chat', '💬', 'Chat', 'Чат', '{"chat","message","talk"}', '{"чат","сообщение"}', 'other'),
('question', '❓', 'Question', 'Вопрос', '{"question","ask","help"}', '{"вопрос","помощь"}', 'other'),
('warning', '⚠️', 'Warning', 'Внимание', '{"warning","caution","alert"}', '{"внимание","осторожно"}', 'other'),
('lock', '🔒', 'Lock', 'Замок', '{"lock","secure","private"}', '{"замок","безопасность"}', 'other'),
('folder', '📁', 'Folder', 'Папка', '{"folder","file","organize"}', '{"папка","файл"}', 'other'),
('settings', '⚙️', 'Settings', 'Настройки', '{"settings","gear","configure"}', '{"настройки","параметры"}', 'other'),
('search', '🔍', 'Search', 'Поиск', '{"search","find","magnify"}', '{"поиск","найти"}', 'other'),
('link', '🔗', 'Link', 'Ссылка', '{"link","chain","connect"}', '{"ссылка","связь"}', 'other'),
('rocket', '🚀', 'Rocket', 'Ракета', '{"rocket","launch","fast"}', '{"ракета","запуск"}', 'other'),
('world', '🌎', 'World', 'Мир', '{"world","earth","globe"}', '{"мир","земля"}', 'other'),
('flag', '🚩', 'Flag', 'Флаг', '{"flag","goal","mark"}', '{"флаг","цель"}', 'other'),
('ribbon', '🎀', 'Ribbon', 'Бантик', '{"ribbon","bow","gift"}', '{"бантик","подарок"}', 'other'),
('camera', '📷', 'Camera', 'Камера', '{"camera","photo","picture"}', '{"камера","фото"}', 'other'),
('microphone', '🎤', 'Microphone', 'Микрофон', '{"microphone","sing","speak"}', '{"микрофон","петь"}', 'other'),
('headphones', '🎧', 'Headphones', 'Наушники', '{"headphones","listen","music"}', '{"наушники","слушать"}', 'other')
ON CONFLICT (key) DO NOTHING;

-- Create indexes for faster searching
CREATE INDEX IF NOT EXISTS idx_icon_library_category ON public.icon_library(category);
CREATE INDEX IF NOT EXISTS idx_icon_library_tags_en ON public.icon_library USING GIN(tags_en);
CREATE INDEX IF NOT EXISTS idx_icon_library_tags_ru ON public.icon_library USING GIN(tags_ru);