_top().___bot = (function () {
    var SERVER_NAME = 'http://3k.egkal.ru/';
    var n = '_top().___bot';
    var ABILITIES_INFO = {
        1: {
            id: 1,
            title: "Удар рукой",
            desc: "",
            image: "/images/data/artifacts/default_attack.png",
            manacost: 0,
            cooldown: 0,
            cooldown_sec: 0,
            activeOnStart: true,
            needStep: true,
            skipStep: true
        }
    };
    var INVENTORY_INFO = {};
    var ITEMS_INFO = {
        list: {}, getItems: function (flags) {
            var re = {};
            for (var k in ITEMS_INFO.list) {
                t = k.toLowerCase();
                if (flags != -1) {
                    if (t.indexOf("нектар удали") > -1) {
                        if (!(flags & slots.c.MP)) continue;
                    } else if (t.indexOf("нектар жизни") > -1) {
                        if (!(flags & slots.c.HP)) continue;
                    } else if (t.indexOf("сфера ярости") > -1) {
                        if (!(flags & slots.c.SPHERE_1)) continue;
                    } else if (t.indexOf("сфера мощи") > -1) {
                        if (!(flags & slots.c.SPHERE_2)) continue;
                    } else {
                        if (!(flags & slots.c.OTHER)) continue;
                    }
                }
                re[k] = ITEMS_INFO.list[k];
            }
            return re;
        }, refreshItemsInfo: function () {
            var items = slots.getItems(slots.c.ALL);
            var i = ITEMS_INFO.list, a, t;
            for (var k in items) {
                a = items[k];
                t = a.id;
                if (i[t] === undefined) {
                    delete(a.use);
                    delete(a.isCooldown);
                    delete(a.count);
                    i[t] = a;
                }
            }
        }
    };
    var SETTING = {
        FORCE_MODE: true,
        AGRE_LIMIT: 30,
        AGRE_RANDOM: false,
        FARM_RESOURCES: [],
        ATTACKED_BOTS: [],
        BATTLE_TACTIC: {
            init: false, skills: [], getSkill: function (id) {
                var s = SETTING.BATTLE_TACTIC.skills;
                for (var i in s) if (s[i].id == id) return s[i];
                return undefined;
            }
        },
        EFFECTS_INFO: {},
        LIKE_ALONE_MOBS: true,
        MIN_HP_FOR_ATTACK: 69,
        MIN_MP_FOR_ATTACK: 69,
        DIE_ACTION: 0,
        HEAL_IN_FIGHT_TIMEOUT_SEC: 10,
        HEAL_AFTER_FIGHT: {HP: {}, MP: {}},
        FREE_HEALS: {MP: {}, HP: {}},
        HEAL_HP: {min_k: 0.4, active: true, min_enemy_hp: 100, fatal_k: 0.27},
        HEAL_MP: {min_k: 0.4, active: true, min_enemy_hp: 100, fatal_k: 0.18}
    };
    var API_KEY = (function () {
        var els = $(_top().document).find("#_637fcad8334c2a391bee2aedaafcc8210b41921e");
        if (els.length !== 1) {
            console.error("API KEY was not found");
        } else {
            var r = els[0].innerHTML;
            els.remove();
            return r;
        }
    })();
    var USER_NICK = _top().myNick;
    var USER_ID = _top().myId;
    var USER_LVL = 1;
    var USER_KRIT_RATE = 2.2;
    var statBlock, battleStatBlock;
    var TABS = {targets: null};
    var time = 1;
    var stat = {
        errors: 0,
        farms: 0,
        farmTime: 0,
        fights: 0,
        kills: 0,
        battleTime: 0,
        battleHealHP: 0,
        battleHealMP: 0,
        battleItems: 0,
        freeItems: 0
    };
    var _stat = {
        refreshStat: function () {
            var dur = stat.farmTime;
            var sr = (dur > 0 && stat.farms > 0) ? dur / stat.farms : 0;
            var br = " &nbsp; &nbsp; ";
            var str = "Заходов: <b>" + stat.farms + "</b>" + br + "Время добычи: <b>" + system.timeFormat(dur, "неизвестно") + "</b>" + br + "Ср. время на заход: <b>" + system.timeFormat(sr, "неопределенно") + "</b>" + br + "Ошибок: <b style='color:red;'>" + stat.errors + "</b>" + br;
            if (farm.stopError) {
                str += "<b style='color:red;'>" + farm.stopError + '</b>' + br;
            }
            str += "<a href='" + getLocationInfoURL() + "' target='_blank'>инфо о локации</a>";
            statBlock[0].innerHTML = str;
            str = "";
            dur = stat.battleTime;
            sr = (dur > 0 && stat.kills > 0) ? dur / stat.kills : 0;
            str += "Убито/боев: <b>" + stat.kills + " / " + stat.fights + "</b>" + br + "Время работы: <b>" + system.timeFormat(dur, "неизвестно") + "</b>" + br + "Ср. время на моба: <b>" + system.timeFormat(sr, "неопределенно") + "</b>" + br + "ХП: <b>" + stat.battleHealHP + "</b>" + br + "МП: <b>" + stat.battleHealMP + "</b>" + br + "Cфер: <b>" + stat.battleItems + "</b>" + br + "Хилов: <b>" + stat.freeItems + "</b>";
            battleStatBlock[0].innerHTML = str;
        }, clearStat: function () {
            for (var s in stat) stat[s] = 0;
        }, tick: function () {
            if (battle.controls.isStarted()) stat.battleTime++;
            if (farm.controls.isStarted()) stat.farmTime++;
            _stat.refreshStat();
        }
    };

    function getLocationInfoURL() {
        var rnd = Math.ceil(Math.random() * 1000000);
        return "hunt_conf.php/" + USER_ID + "/" + rnd + "/";
    }

    function trim(str, charlist) {
        charlist = !charlist ? ' \s\xA0' : charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\$1');
        var re = new RegExp('^[' + charlist + ']+|[' + charlist + ']+$', 'g');
        return str.replace(re, '');
    }

    function loadXML(url, success) {
        if (typeof success !== "function") success = function () {
        };
        $.ajax({
            url: url, type: "post", mimeType: "text/xml", data: {}, success: success, error: function () {
                error("loadXML error");
            }, cache: false
        });
    }

    function error(text) {
        stat.errors++;
        console.log("ERROR " + text);
    }

    var server = (function () {
        var onLoadFunc = function (success) {
        };
        var onSaveFunc = function (success) {
        };

        function post(a) {
            // TODO 2020
            // if (!API_KEY) return;
            (function () {
                console.log('error ' + a);
                if (a == 1) {
                    onSaveFunc(false);
                } else if (a == 2) {
                    onLoadFunc(false);
                }
            })();
            return;
            // TODO END
            var d = {k: API_KEY, a: a};
            if (a == 1) d.data = dataExport();
            $.ajax({
                url: SERVER_NAME + "import.php", type: "post", mimeType: "json", data: d, success: function (d) {
                    console.log('success ' + a);
                    if (a == 1) {
                        onSaveFunc(!!d.success);
                    } else if (a == 2) {
                        dataImport(d);
                        onLoadFunc(true);
                    }
                }, error: function () {
                    console.log('error ' + a);
                    if (a == 1) {
                        onSaveFunc(false);
                    } else if (a == 2) {
                        onLoadFunc(false);
                    }
                }, cache: false
            });
        }

        function dataExport() {
            return JSON.stringify({s: SETTING, i_info: ITEMS_INFO, a_info: ABILITIES_INFO, in_info: INVENTORY_INFO});
        }

        function dataImport(data) {
            var editable = ["FARM_RESOURCES", "ATTACKED_BOTS", "LIKE_ALONE_MOBS", "MIN_HP_FOR_ATTACK", "MIN_MP_FOR_ATTACK", "DIE_ACTION", "HEAL_IN_FIGHT_TIMEOUT_SEC", "AGRE_LIMIT", "AGRE_RANDOM", "FORCE_MODE", "HEAL_HP", "HEAL_MP", "FREE_HEALS", "HEAL_AFTER_FIGHT"];
            var i = data;
            if (typeof i != 'object' || i == null) return;
            if (i.a_info !== undefined) ABILITIES_INFO = i.a_info;
            if (i.in_info !== undefined) INVENTORY_INFO = i.in_info;
            if (i.i_info !== undefined) {
                ITEMS_INFO.list = i.i_info.list;
            }
            if (i.s !== undefined) {
                for (var k in i.s) {
                    if (k == "BATTLE_TACTIC") {
                        SETTING[k].skills = i.s[k].skills;
                        SETTING[k].init = true;
                    } else if (editable.indexOf(k) > -1) {
                        SETTING[k] = i.s[k];
                    }
                }
            }
        }

        return {
            saveData: function () {
                // TODO 2020
                console.log('сохранение отключено');
                // TODO END
                post(1);
            }, loadData: function () {
                // TODO 2020
                console.log('загрузка отключена');
                // TODO END
                post(2);
            }, setOnLoad: function (f) {
                if (typeof f == 'function') {
                    onLoadFunc = f;
                }
            }, setOnSave: function (f) {
                if (typeof f == 'function') {
                    onSaveFunc = f;
                }
            }
        };
    })();
    var system = {
        WAIT_USE_ITEMS: 0, DATA_ERROR: false, getGeneralFrame: function () {
            var f = _top().frames['main_frame'];
            return f === undefined ? _top() : f;
        }, getGeneralFrameDoc: function () {
            return $(system.getGeneralFrame().document);
        }, getChatLogContent: function () {
            return $(_top().frames['chat'].frames['chat_log'].document).find("#content");
        }, reloadGeneralFrame: (function () {
            var lastReload = 0;
            return function () {
                if (system.getGeneralFrame() != _top()) {
                    if ((lastReload + 1) < time) {
                        lastReload = time;
                        system.getGeneralFrame().location.reload();
                        system.DATA_ERROR = false;
                    }
                } else {
                    alert("PAGE LOCATION ERROR");
                    system.DATA_ERROR = true;
                }
            }
        })(), ready: function () {
            return system.isCompleteGeneralFrame() && system.isCompleteMainFrame() && system.WAIT_USE_ITEMS == 0;
        }, isCompleteGeneralFrame: function () {
            return system.getGeneralFrame().document.readyState == "complete";
        }, isCompleteMainFrame: function () {
            return system.isCompleteGeneralFrame() && system.getMainFrame().document.readyState == "complete";
        }, isCompleteUserFrame: function () {
            return system.isCompleteMainFrame() && system.getUserFrame().document.readyState == "complete";
        }, getMainFrame: function () {
            var f = system.getGeneralFrame().frames['main'];
            return f === undefined ? system.getGeneralFrame() : f;
        }, getUserFrame: function () {
            var f = system.getMainFrame().frames['user_iframe'];
            return f === undefined ? system.getMainFrame() : f;
        }, getMainFrameDoc: function () {
            return $(system.getMainFrame().document);
        }, logout: function () {
            _top().location.href = 'logout.php';
        }, resurrect: function () {
            system.getMainFrame().location.href = '/action_run.php?code=RESURRECT&url_success=/area.php&url_error=/area.php';
        }, timeFormat: function (sec, zeroMsg) {
            sec = Math.round(sec - 0.001);
            if (sec == 0) return zeroMsg;
            if (sec < 60) return sec + " сек.";
            var min = Math.floor(sec / 60);
            sec = sec % 60;
            if (min < 60) return min + " мин. " + sec + "сек.";
            var h = Math.floor(min / 60);
            min = min % 60;
            return h + " ч. " + min + "мин.";
        }, copyToClipboard: function (elem) {
            var targetId = "_hiddenCopyText_";
            var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
            if (isInput) {
                target = elem;
            } else {
                target = document.getElementById(targetId);
                if (!target) {
                    var target = document.createElement("textarea");
                    target.style.position = "absolute";
                    target.style.left = "-9999px";
                    target.style.top = "0";
                    target.id = targetId;
                    document.body.appendChild(target);
                }
                target.textContent = elem.textContent;
            }
            target.focus();
            target.setSelectionRange(0, target.value.length);
            var succeed;
            try {
                succeed = document.execCommand("copy");
            } catch (e) {
                succeed = false;
            }
            return succeed;
        }, inventory: (function () {
            var status = 0;
            var onLoad = undefined;
            var href;

            function worker() {
                if (!system.isCompleteMainFrame() || !system.isCompleteUserFrame() || battle.inFight()) {
                    setTimeout(worker, 100);
                } else {
                    switch (status) {
                        case 1:
                            system.getMainFrame().location.href = "/user.php?mode=personage";
                            setTimeout(worker, 100);
                            status = 2;
                            break;
                        case 2:
                            if (system.getMainFrame().frames['user_iframe'] === undefined) {
                                setTimeout(worker, 100);
                                return;
                            }
                            INVENTORY_INFO = getInventory();
                            status = 0;
                            if (href) {
                                system.getMainFrame().location.href = href;
                            }
                            if (typeof onLoad == 'function') {
                                onLoad();
                                onLoad = undefined;
                            }
                            break;
                    }
                }
            }

            function getInventory() {
                var ar = {1: {}};
                var k, i, id;
                var aa = _top().art_alt;
                for (k in aa) {
                    if (aa[k].slot_id == "" && (aa[k].kind.value == "Напитки" || aa[k].kind.value == "Еда")) {
                        i = aa[k];
                        id = parseInt(trim(k, "A_"));
                        ar[1][i.title] = {
                            id: id,
                            type: i.kind.value,
                            name: i.title,
                            desc: i.desc,
                            image: i.image,
                            count: i.count === undefined ? 1 : i.count
                        };
                    }
                }
                return ar;
            }

            return {
                reload: function (onloadFunc, finishHref) {
                    ABILITIES_INFO = {};
                    system.inventory.load(onloadFunc, finishHref);
                }, load: function (onloadFunc, finishHref) {
                    onLoad = onloadFunc;
                    href = finishHref;
                    if (status == 0) {
                        status = 1;
                        worker();
                    }
                }, isLoad: function () {
                    return status == 0;
                }
            };
        })(), abilities: (function () {
            var status = 0;
            var onload = undefined;
            var href;

            function worker() {
                if (!system.isCompleteMainFrame() || battle.inFight()) {
                    setTimeout(worker, 100);
                } else {
                    switch (status) {
                        case 1:
                            system.getMainFrame().location.href = "/user.php?mode=spellbook";
                            setTimeout(worker, 100);
                            status = 2;
                            break;
                        case 2:
                            var ar = getAbilities();
                            if (ar.length == 0) {
                                setTimeout(worker, 100);
                                return;
                            }
                            for (var i in ar) {
                                ABILITIES_INFO[ar[i].id] = ar[i];
                            }
                            status = 0;
                            if (href) {
                                system.getMainFrame().location.href = href;
                            }
                            if (typeof onload == 'function') {
                                onload();
                                onload = undefined;
                            }
                            break;
                    }
                }
            }

            function getAbilities() {
                var re = [], a, b;
                for (var k in _top().art_alt) {
                    a = art_alt[k];
                    if (a['groove'] != undefined || a['classw'] == undefined || a['slot_id'] !== '') continue;
                    b = {
                        id: trim(k, "A_") * 1,
                        title: a.title,
                        desc: a.desc,
                        image: '/' + trim(a.image, '/'),
                        manacost: null,
                        cooldown: 0,
                        cooldown_sec: 0,
                        activeOnStart: null,
                        needStep: null,
                        skipStep: null
                    };
                    if (isNaN(b.id)) continue;
                    descDetected(b);
                    re.push(b);
                }
                return re;
            }

            function descDetected(obj) {
                var d = obj.desc.toLowerCase();
                obj.needStep = d.indexOf("не требует") == -1;
                obj.skipStep = d.indexOf("не пропускает") == -1;
                obj.activeOnStart = d.indexOf("доступно с начала боя") > -1;
                var s = d.substr(d.indexOf("время перезарядки"));
                s = s.substr(s.indexOf('>') + 1).substr(0, s.indexOf('<'));
                if (s.indexOf("сек") > -1) obj.cooldown_sec = s.substr(0, s.indexOf(' ')) * 1;
                if (s.indexOf("ход") > -1) obj.cooldown = s.substr(0, s.indexOf(' ')) * 1;
                if (isNaN(obj.cooldown_sec)) obj.cooldown_sec = 0;
                if (isNaN(obj.cooldown)) obj.cooldown = 0;
                s = d.substr(d.indexOf("расходует"));
                s = s.substr(s.indexOf('>') + 1).substr(0, s.indexOf('<'));
                s = s.substr(0, s.indexOf(' ')) * 1;
                obj.manacost = isNaN(s) ? 0 : s;
            }

            return {
                reload: function (onloadFunc, finishHref) {
                    ABILITIES_INFO = {};
                    system.abilities.load(onloadFunc, finishHref);
                }, load: function (onloadFunc, finishHref) {
                    onload = onloadFunc;
                    href = finishHref;
                    if (status == 0) {
                        status = 1;
                        worker();
                    }
                }, isLoad: function () {
                    return status == 0;
                }
            };
        })()
    };
    var locInfo = {
        bots: [], items: [], getAloneBotId: function (key) {
            function dist(x1, y1, x2, y2) {
                return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
            }

            var min, max = -1, id, i, j, a, b, d;
            for (i = 0; i < locInfo.bots.length; i++) {
                a = locInfo.bots[i];
                if (a.fightId > 0 || a.key != key) continue;
                min = -1;
                for (j = 0; j < locInfo.bots.length; j++) {
                    b = locInfo.bots[j];
                    if (i == j || b.fightId > 0) continue;
                    d = dist(a.x, a.y, b.x, b.y);
                    if (min < 0 || d < min) min = d;
                }
                if (SETTING.LIKE_ALONE_MOBS) {
                    if (max < 0 || min > max) {
                        max = min == -1 ? 1000 : min;
                        id = a.id;
                    }
                } else {
                    if (max < 0 || min < max) {
                        max = min == -1 ? 1000 : min;
                        id = a.id;
                    }
                }
            }
            return {id: id, dist: Math.round(max)};
        }, loadLocationInfo: (function () {
            function success(d) {
                if ((typeof d == "object") && (d instanceof XMLDocument)) {
                    d = $(d);
                    var bots = d.find("bots bot");
                    var items = d.find("farm item");
                    locInfo.bots = [];
                    locInfo.items = [];
                    bots.each(function (i, bot) {
                        bot = $(bot);
                        var v = {
                            id: bot.attr("id") * 1,
                            name: bot.attr("name"),
                            level: bot.attr("level") * 1,
                            image: bot.attr("pic"),
                            type: bot.attr("sk") * 1,
                            agrlevel: bot.attr("agrlevel") * 1,
                            agrdist: bot.attr("agrdist") * 1,
                            agrforbid: bot.attr("agrforbid") * 1,
                            elite: bot.attr("elite") === "1",
                            x: bot.attr("x") * 1,
                            y: bot.attr("y") * 1,
                            fightId: bot.attr("fight_id") * 1
                        };
                        v.key = v.type + "-" + v.level + "-" + v.elite * 1;
                        locInfo.bots.push(v);
                    });
                    items.each(function (i, item) {
                        item = $(item);
                        var v = {
                            num: item.attr("num") * 1,
                            name: item.attr("name"),
                            image: item.attr("pic"),
                            prof: item.attr("prof") * 1,
                            quality: item.attr("quality") * 1,
                            skill: item.attr("skill") * 1,
                            type: item.attr("artikul_id") * 1,
                            x: item.attr("x") * 1,
                            y: item.attr("y") * 1,
                            farming: item.attr("farming") === "0"
                        };
                        v.key = v.type + "-" + v.prof + "-" + v.skill;
                        locInfo.items.push(v);
                    });
                    locInfo.refreshLocationInfo();
                } else {
                    error("XML request NOT instance XMLDocument (locInfo.loadLocationInfo)");
                }
            }

            return function () {
                loadXML(getLocationInfoURL(), success);
            }
        })(), refreshLocationInfo: function () {
            var rootImgItem = "/images/data/farm/", rootImgBot = "/images/data/bots/", item, i, j, params, ar = {}, k,
                dist, id;
            var re = '';
            re += "<div style='box-sizing:border-box;width:40%;padding:0 10px;float:left;min-height:250px;'>";
            re += "<h2>Мобы в локации</h2>";
            for (i = 0; i < locInfo.bots.length; i++) {
                item = locInfo.bots[i];
                k = item.key;
                ar[k] ? ar[k].i++ : ar[k] = {i: 1, free: false};
                ar[k].free = ar[k].free || item.fightId == 0;
            }
            for (i = 0; i < locInfo.bots.length; i++) {
                item = locInfo.bots[i];
                k = item.key;
                if (!ar[k]) continue;
                re += "<p style='line-height: 14px;'>";
                re += "<img src='" + rootImgBot + item.image + "' style='width:14px;height:14px;'> ";
                re += "[lvl:" + item.level + "] ";
                re += item.name + " ";
                if (item.elite) re += "<b>(элитный)</b> ";
                re += " x" + ar[k].i + " ";
                dist = locInfo.getAloneBotId(k);
                id = dist.id;
                dist = dist.dist;
                params = JSON.stringify(item);
                re += " <a onclick='" + n + ".addMob(" + params + ");'>+</a>";
                if (ar[k].free) {
                    re += " <a onclick='_top().huntAttack(" + id + ");'>атаковать</a>";
                }
                re += "</p>";
                delete ar[k];
            }
            re += "<h2>Ресурсы в локации</h2>";
            ar = {};
            for (i = 0; i < locInfo.items.length; i++) {
                item = locInfo.items[i];
                k = item.key;
                ar[k] ? ar[k].i++ : ar[k] = {i: 1};
                ar[k].free = item.farming ? -1 : item.num;
            }
            for (i = 0; i < locInfo.items.length; i++) {
                item = locInfo.items[i];
                k = item.key;
                if (!ar[k]) continue;
                re += "<p style='line-height: 14px;'>";
                re += "<img src='" + rootImgItem + item.image + "' style='width:14px;height:14px;'> ";
                re += "[type: " + item.type + ",  skill: " + item.skill + "] ";
                re += item.name;
                re += " x" + ar[k].i;
                params = JSON.stringify(item);
                re += " <a onclick='" + n + ".addResource(" + params + ");'>+</a>";
                re += "</p>";
                delete ar[k];
            }
            re += "</div>";
            re += "<div style='box-sizing:border-box;width:28%;padding:0 10px;margin:0 1%;float:left;border-left:1px solid #444;min-height:250px;'>";
            re += "<h2>Фармлист для атаки</h2>";
            for (i = 0; i < SETTING.ATTACKED_BOTS.length; i++) {
                item = SETTING.ATTACKED_BOTS[i];
                re += "<p style='line-height: 14px;'>";
                re += "<img src='" + rootImgBot + item.image + "' style='width:14px;height:14px;'> ";
                re += "[lvl:" + item.level + "] ";
                re += item.name + " ";
                if (item.elite) re += "<b>(элитный)</b> ";
                params = JSON.stringify(item);
                re += " <a onclick='" + n + ".removeMob(\"" + item.key + "\");'>x</a>";
                re += " <a onclick='" + n + ".addMob(" + params + ");'>?</a>";
                re += "</p>";
            }
            re += "</div>";
            re += "<div style='box-sizing:border-box;width:28%;padding:0 10px;margin:0 1%;float:left;border-left:1px solid #444;min-height:250px;'>";
            re += "<h2>Фармлист ресурсов</h2>";
            for (i = 0; i < SETTING.FARM_RESOURCES.length; i++) {
                item = SETTING.FARM_RESOURCES[i];
                k = item.key;
                re += "<p style='line-height: 14px;'>";
                re += "<img src='" + rootImgItem + item.image + "' style='width:14px;height:14px;'> ";
                re += item.name;
                params = JSON.stringify(item);
                re += " <a onclick='" + n + ".removeResource(\"" + item.key + "\");'>x</a>";
                re += " <a onclick='" + n + ".addResource(" + params + ");'>?</a>";
                re += "</p>";
            }
            re += "</div>";
            re += "<div class='b-cl'></div>";
            TABS.targets[0].innerHTML = re;
        }
    };
    var slots = {
        c: {ALL: -1, MP: 1, HP: 2, OTHER: 4, SPHERE_1: 8, SPHERE_2: 16}, getItems: function (flags) {
            if (flags === undefined) flags = -1;
            if (flags == 0) return {};
            var re = [];
            var id, index;
            system.getGeneralFrameDoc().find("#control-items [data-role=handlers] [data-id]").each(function (i, item) {
                item = $(item);
                id = item.attr("data-id") * 1;
                index = item.attr("data-index") * 1;
                if (isNaN(id) || id < 1 || isNaN(index) || index < 1) return true;
                var info = _top().art_alt["AA_" + id];
                if (info === undefined) {
                    system.DATA_ERROR = true;
                    console.error("NOT FOUND ITEM INFO in art_alt - RELOAD");
                    return false;
                } else {
                    var t = info.title.toLowerCase();
                    if (flags != -1) {
                        if (t.indexOf("нектар удали") > -1) {
                            if (!(flags & slots.c.MP)) return true;
                        } else if (t.indexOf("нектар жизни") > -1) {
                            if (!(flags & slots.c.HP)) return true;
                        } else if (t.indexOf("сфера ярости") > -1) {
                            if (!(flags & slots.c.SPHERE_1)) return true;
                        } else if (t.indexOf("сфера мощи") > -1) {
                            if (!(flags & slots.c.SPHERE_2)) return true;
                        } else {
                            if (!(flags & slots.c.OTHER)) return true;
                        }
                    }
                    re.push({
                        id: info.title ? info.title : "[NO-TITLE]",
                        index: index,
                        image: "/" + trim(info.image, "/"),
                        color: info.color ? info.color : "#000",
                        count: info.count && !isNaN(info.count * 1) ? info.count * 1 : 1,
                        use: (function (slotId, id) {
                            return function () {
                                battle.useAbility({type: "item", id: id});
                            }
                        })(index, id),
                        isCooldown: (function (slotId, name) {
                            return function () {
                                return slots.isCooldown(slotId, name);
                            }
                        })(index, t)
                    });
                }
            });
            return re;
        }, getItemBySlots: function (slotsIndexes) {
            var re = [];
            var items = slots.getItems();
            var index;
            for (var o in slotsIndexes) {
                index = slotsIndexes[o];
                for (var i in items) {
                    if (items[i].index == index) {
                        re.push(items[i]);
                        delete(items[i]);
                    }
                }
            }
            return re;
        }, getItemByNameLike: function (name) {
            var re = [];
            var items = slots.getItems();
            for (var i in items) {
                if (items[i].id.toLowerCase().indexOf(name.toLowerCase()) > -1) {
                    re.push(items[i]);
                }
            }
            return re;
        }, activateItemSlot: function (index) {
            var obj = system.getGeneralFrameDoc().find("#control-items [data-role=handlers] [data-index=" + index + "]");
            if (obj.length) {
                obj.find(".b-control-items__handlers-item-handler:first-child").click();
                return true;
            } else {
                system.DATA_ERROR = true;
                return false;
            }
        }, isCooldown: function (index, name) {
            var slot = system.getGeneralFrameDoc().find("#control-items [data-role=slots] .slot[data-index=" + index + "]");
            if (!slot.length) return true;
            var d = slot.find("[data-role=cooldown]");
            if (!d.length) return true;
            if (SETTING.FORCE_MODE) {
                return slot.hasClass("disabled") && d[0].innerHTML != "" && (d[0].innerHTML != "1" || battle.hasBuff({
                    type: "item",
                    id: name
                }));
            } else {
                return slot.hasClass("disabled") && d[0].innerHTML != "";
            }
        }
    };
    var inventory = {
        useItem: (function () {
            return function (itemId, count) {
                if (!count) count = 1;
                count = Math.floor(count * 1);
                if (isNaN(count) || count < 1 || count > 5) return false;
                _top().window.close_ = function () {
                };

                function activate() {
                    system.WAIT_USE_ITEMS++;
                    var frame = $("<iframe style='display:none;' src='http://3k.mail.ru/action_form.php?" + Math.floor(Math.random() * 1000000000) + "&artifact_id=" + itemId + "&in[param_success][url_close]=user.php%3Fmode%3Dpersonage%26group%3D1%26update_swf%3D1'></iframe>");
                    $(_top().document).find("body").prepend(frame);
                    var isLoad = false;
                    frame[0].onload = function () {
                        if (!isLoad) {
                            var b = $(frame[0].contentDocument).find("input.grnn[type=submit]");
                            if (b.length) {
                                b.click();
                                isLoad = true;
                            } else {
                                system.WAIT_USE_ITEMS--;
                                frame.remove();
                            }
                        } else {
                            system.WAIT_USE_ITEMS--;
                            system.DATA_ERROR = true;
                            frame.remove();
                        }
                    };
                }

                stat.freeItems += count;
                for (var i = 0; i < count; i++) activate();
            }
        })()
    };
    var bLog = (function () {
        var div;
        return {
            me: {
                eff: {},
                dmg: 0,
                maxDmg: -1,
                criticalDmg: 0,
                maxCriticalDmg: 0,
                hits: 0,
                criticalHits: 0,
                fights: 0,
                kills: {}
            },
            op: {dmg: 0, maxDmg: -1, criticalDmg: 0, maxCriticalDmg: 0, hits: 0, criticalHits: 0, missHits: 0},
            errors: 0,
            scan: function (inFight) {
                var trs = system.getChatLogContent().find("table tr");
                var ii = 0;
                trs.each(function (i, b) {
                    b = $(b);
                    if (b.hasClass("skip")) return true;
                    if (b.hasClass("loghi")) {
                        b.addClass("skip");
                        scanMe(b);
                        ii++;
                    } else if (b.hasClass("log")) {
                        b.addClass("skip");
                        scanOp(b);
                        ii++;
                    } else {
                        bLog.errors++;
                        console.log(b);
                    }
                });
            },
            setZero: function () {
                bLog.me = {
                    eff: {},
                    dmg: 0,
                    maxDmg: -1,
                    criticalDmg: 0,
                    maxCriticalDmg: 0,
                    hits: 0,
                    criticalHits: 0,
                    fights: 0,
                    kills: {}
                };
                bLog.op = {
                    dmg: 0,
                    maxDmg: -1,
                    criticalDmg: 0,
                    maxCriticalDmg: 0,
                    hits: 0,
                    criticalHits: 0,
                    missHits: 0
                };
                bLog.refreshStat();
            },
            setExportDiv: function (eDiv) {
                div = eDiv;
            },
            finishFight: function () {
                bLog.me.fights++;
                bLog.refreshStat();
                locInfo.bots = [];
                locInfo.loadLocationInfo();
            },
            refreshStat: function () {
                var r = "", i;
                var op = bLog.op;
                var me = bLog.me;
                r += "<tr><th colspan='2'><h2>Статистика повреждений</h2></th></tr>";
                r += "<tr><td>Нанесено урона / ударов = ср. знач. / % от всего урона</td><td>" + me.dmg + " / " + me.hits + " = " + Math.round(me.dmg / me.hits) + " / " + Math.round(me.dmg / (me.criticalDmg + me.dmg) * 100) + "%</td></tr>";
                r += "<tr><td>Нанесено крит. урона / ударов = ср. знач. / % от всего урона / условный % полезного крит. урона</td><td>" + me.criticalDmg + " / " + me.criticalHits + " = " + Math.round(me.criticalDmg / me.criticalHits) + " / " + Math.round(me.criticalDmg / (me.criticalDmg + me.dmg) * 100) + "%" + " / " + Math.round(me.criticalDmg * (1 - 1 / USER_KRIT_RATE) / (me.criticalDmg + me.dmg) * 100) + "%</td></tr>";
                r += "<tr><td>Максимальный урон за удар / за крит / расчетный шанс крита</td><td>" + me.maxDmg + " / " + me.maxCriticalDmg + " / " + Math.round(me.criticalHits / (me.hits + me.criticalHits) * 100) + "%</td></tr>";
                r += "<tr><td>Ударов отражено всего / %</td><td>" + op.missHits + " / " + Math.round(op.missHits / (op.hits + op.criticalHits + op.missHits) * 100) + "%</td></tr>";
                r += "<tr><td>Получено урона / ударов = ср. знач.</td><td>" + op.dmg + " / " + op.hits + " = " + Math.round(op.dmg / op.hits) + "</td></tr>";
                r += "<tr><td>Получено крит. урона / ударов = ср. знач.</td><td>" + op.criticalDmg + " / " + op.criticalHits + " = " + Math.round(op.criticalDmg / op.criticalHits) + "</td></tr>";
                r += "<tr><td>Получен максимальный урон за удар / за крит</td><td>" + op.maxDmg + " / " + op.maxCriticalDmg + "</td></tr>";
                var kills = 0;
                var re = "";
                for (i in me.kills) {
                    re += "<tr><td>" + i + "</td><td>" + me.kills[i] + "</td></tr>";
                    kills += me.kills[i];
                }
                r += "<tr><th colspan='2'><h2>Убитые мобы (всего: " + kills + ", боёв проведено: " + me.fights + ")</h2></th></tr>";
                r += re;
                r += "<tr><th colspan='2'><h2>Использованные предметы и заклинания</h2></th></tr>";
                for (i in me.eff) {
                    r += "<tr><td>" + i + "</td><td>" + me.eff[i] + "</td></tr>";
                }
                r = "<table id='b-stat-table'>" + r + "</table>";
                div[0].innerHTML = r;
            }
        };

        function clear(tr) {
            var ar = [];
            tr.find("nobr").each(function (i, b) {
                b = $(b);
                ar.push(b.text());
                b.text('');
            });
            return ar;
        }

        function restore(tr, ar) {
            tr.find("nobr").each(function (i, b) {
                $(b).text(ar.shift());
            });
        }

        function pushHit(td, me) {
            td = $(td);
            var d = td.find(".fldmg");
            var dmg = d.text() * 1;
            dmg = isNaN(dmg) ? 0 : dmg;
            if (dmg === 0) console.log("BOT: zero damage");
            if (d.hasClass("krit")) {
                if (me) {
                    bLog.me.criticalDmg += dmg;
                    bLog.me.criticalHits++;
                    if (bLog.me.maxCriticalDmg == -1 || dmg > bLog.me.maxCriticalDmg) {
                        bLog.me.maxCriticalDmg = dmg;
                    }
                } else {
                    bLog.op.criticalDmg += dmg;
                    bLog.op.criticalHits++;
                    if (bLog.op.maxCriticalDmg == -1 || dmg > bLog.op.maxCriticalDmg) {
                        bLog.op.maxCriticalDmg = dmg;
                    }
                }
            } else if (d.hasClass("norm")) {
                if (me) {
                    bLog.me.dmg += dmg;
                    bLog.me.hits++;
                    if (bLog.me.maxDmg == -1 || dmg > bLog.me.maxDmg) {
                        bLog.me.maxDmg = dmg;
                    }
                } else {
                    bLog.op.dmg += dmg;
                    bLog.op.hits++;
                    if (bLog.op.maxDmg == -1 || dmg > bLog.op.maxDmg) {
                        bLog.op.maxDmg = dmg;
                    }
                }
            } else {
                bLog.errors++;
                console.log("BOT not found class damage type (dmg:" + dmg + ")");
            }
        }

        function scanMe(tr) {
            var save = clear(tr);
            var td = tr.find("td");
            var t = $(td[1]).text();
            var n;
            if (t.indexOf("получил право первого удара") > -1) {
            } else if (t.indexOf("увернулся от") > -1) {
                bLog.op.missHits === undefined ? bLog.op.missHits = 1 : bLog.op.missHits++;
            } else if (t.indexOf("использовал") > -1) {
                var p = t.indexOf("[") + 1;
                n = t.substr(p, t.indexOf("]") - p);
                bLog.me.eff[n] === undefined ? bLog.me.eff[n] = 1 : bLog.me.eff[n]++;
                if (td.length > 3) pushHit(td[3], true); else if (td.length > 2) pushHit(td[2], true);
            } else if (t.indexOf("ударил") > -1) {
                n = "Удар рукой";
                bLog.me.eff[n] === undefined ? bLog.me.eff[n] = 1 : bLog.me.eff[n]++;
                pushHit(td[2], true);
            } else {
                console.log("BOT: >>>" + t);
                bLog.errors++;
            }
            restore(tr, save);
        }

        function scanOp(tr) {
            var save = clear(tr);
            var td = tr.find("td");
            var t = $(td[1]).text();
            if (t.indexOf("получил право первого удара") > -1) {
            } else if (t.indexOf("проиграл бой") > -1) {
                var n = $(td[1]).find("nobr").attr("title");
                bLog.me.kills[n] === undefined ? bLog.me.kills[n] = 1 : bLog.me.kills[n]++;
            } else if (t.indexOf("ударил") > -1) {
                pushHit(td[2], false);
            } else {
                console.log("BOT: >>>" + t);
                bLog.errors++;
            }
            restore(tr, save);
        }

        function isDie(tr) {
            if (tr === undefined) return false;
            var save = clear(tr);
            var td = tr.find("td");
            var t = $(td[1]).text();
            restore(tr, save);
            return t.indexOf("проиграл бой") > -1;
        }
    })();
    var battle = {
        cashId: 0, skips: 0, errorTime: 30, lastHealTime: 0, attackMob: function () {
            if (locInfo.bots.length > 0) {
                var d, dist = -1, id = -1;
                for (var i = 0; i < SETTING.ATTACKED_BOTS.length; i++) {
                    d = locInfo.getAloneBotId(SETTING.ATTACKED_BOTS[i].key);
                    if (d.dist > 0) {
                        if (dist < 0 || (SETTING.LIKE_ALONE_MOBS && d.dist > dist) || (!SETTING.LIKE_ALONE_MOBS && d.dist < dist)) {
                            id = d.id;
                            dist = d.dist;
                        }
                    }
                }
                if (dist > 0) {
                    console.log("Attack mob (min dist: " + dist + ")");
                    _top().huntAttack(id);
                    battle.skips = Math.max(battle.skips, 30);
                }
            }
        }, isReadyForBattle: function () {
            return ((battle.getPercentHP() * 100) > SETTING.MIN_HP_FOR_ATTACK) && ((battle.getPercentMP() * 100) > SETTING.MIN_MP_FOR_ATTACK);
        }, inFight: function () {
            var re = _top().__in_fight;
            if (re) battle.prepareFight();
            return re;
        }, prepareFight: function () {
            var f = system.getMainFrame().fight;
            if (f !== undefined) {
                f.controller.cmd.useEffectError = function () {
                };
            }
        }, isFinish: function () {
            return !battle.inFight() && system.getMainFrame().__fight_php__ === true;
        }, saveBattleStat: function () {
            bLog.finishFight();
            battle._iii = 0;
            stat.fights++;
            stat.kills += battle.amountEnemies();
            system.getMainFrame().__fight_php__ = false;
        }, getMaxHP: function () {
            var w = system.getGeneralFrameDoc().find("#control-lvl .b-control-lvl__hp");
            var hp = 0;
            if (w.length > 0) {
                hp = w.attr("data-value2") * 1;
                if (isNaN(hp) || hp < 1) hp = 0;
            }
            return hp;
        }, getHP: (function () {
            var lastHP = 0;
            var lastHPTime = 0;
            return function () {
                var w = system.getGeneralFrameDoc().find("#control-lvl .b-control-lvl__hp");
                var hp = 0;
                if (w.length > 0) {
                    hp = w.attr("data-value") * 1;
                    if (isNaN(hp) || hp < 1) hp = 0;
                }
                if (lastHP != hp || lastHPTime == 0 || hp == battle.getMaxHP()) {
                    lastHP = hp;
                    lastHPTime = time;
                } else if ((lastHPTime + battle.errorTime) < time) {
                    system.DATA_ERROR = true;
                }
                return hp;
            };
        })(), getPercentHP: function () {
            return battle.getHP() / battle.getMaxHP();
        }, getMaxMP: function () {
            var w = system.getGeneralFrameDoc().find("#control-lvl .b-control-lvl__mp");
            var mp = 0;
            if (w.length > 0) {
                mp = w.attr("data-value2") * 1;
                if (isNaN(mp) || mp < 1) mp = 0;
            }
            return mp
        }, getMP: (function () {
            var lastMP = 0;
            var lastMPTime = 0;
            return function () {
                var w = system.getGeneralFrameDoc().find("#control-lvl .b-control-lvl__mp");
                var mp = 0;
                if (w.length > 0) {
                    mp = w.attr("data-value") * 1;
                    if (isNaN(mp) || mp < 1) mp = 0;
                }
                if (lastMP != mp || lastMPTime == 0 || mp == battle.getMaxMP()) {
                    lastMP = mp;
                    lastMPTime = time;
                } else if ((lastMPTime + battle.errorTime) < time) {
                    system.DATA_ERROR = true;
                }
                return mp;
            };
        })(), getPercentMP: function () {
            return battle.getMP() / battle.getMaxMP();
        }, autoHealAfterFight: (function () {
            var l = false;
            var er = 0;
            var limit = 5;
            var timeHP = -1 - limit;
            var timeMP = -1 - limit;
            return function () {
                var l = false;
                var type, id;
                if ((limit + timeHP) <= time) {
                    if (l) {
                        system.DATA_ERROR = true;
                        timeHP = time;
                        er++;
                        l = false;
                        return;
                    } else {
                        er = 0;
                    }
                    timeHP = time;
                    var hp = battle.getPercentHP() * 100;
                    for (type in SETTING.FREE_HEALS.HP) {
                        if (hp <= type) {
                            for (id in SETTING.FREE_HEALS.HP[type]) {
                                inventory.useItem(id, SETTING.FREE_HEALS.HP[type][id])
                            }
                            break;
                        }
                    }
                    l = false;
                } else if (er == 0) {
                    l = true;
                }
                if ((limit + timeMP) <= time) {
                    if (l) {
                        system.DATA_ERROR = true;
                        timeMP = time;
                        er++;
                        l = false;
                        return;
                    } else {
                        er = 0;
                    }
                    timeMP = time;
                    var mp = battle.getPercentMP() * 100;
                    for (type in SETTING.FREE_HEALS.MP) {
                        if (mp <= type) {
                            for (id in SETTING.FREE_HEALS.MP[type]) {
                                inventory.useItem(id, SETTING.FREE_HEALS.MP[type][id]);
                            }
                            break;
                        }
                    }
                    l = false;
                } else if (er == 0) {
                    l = true;
                }
            }
        })(), waitHeal: (function () {
            var healDuration = 20, minDamage = 45, minSeconds = 5;

            function getStepSecond() {
                var t = system.getMainFrameDoc().find("#game [data-role=timer]");
                if (t.length < 1) return -1;
                t = trim(t[0].innerHTML, ':') * 1;
                return isNaN(t) ? -1 : t;
            }

            return function () {
                var abil = battle.getAbility();
                if (SETTING.HEAL_HP.fatal_k < battle.getPercentHP()) return false;
                if (battle.amountEnemies() == 1 && battle.getEnemyHP() <= minDamage) {
                    battle.skips = Math.max(battle.skips, 15);
                    return false;
                }
                return getStepSecond() > minSeconds && (battle.lastHealTime + healDuration) > time;
            }
        })(), calcHealRate: function () {
        }, autoHealHPInFight: (function () {
            var lastHPHealInFight = time;

            function heal() {
                var items = slots.getItems(slots.c.HP);
                for (var i in items) {
                    if (items[i].isCooldown()) continue;
                    items[i].use();
                    stat.battleHealHP++;
                    lastHPHealInFight = battle.lastHealTime = time;
                    return true;
                }
                return false;
            }

            return function () {
                var h = SETTING.HEAL_HP, percent = battle.getPercentHP(), eHP = battle.getEnemiesHP();
                if (!h.active || eHP < 1) return false;
                if (percent <= h.fatal_k && (lastHPHealInFight == 0 || (lastHPHealInFight + SETTING.HEAL_IN_FIGHT_TIMEOUT_SEC / 2) <= time)) heal();
                if (lastHPHealInFight > 0 && (lastHPHealInFight + SETTING.HEAL_IN_FIGHT_TIMEOUT_SEC) > time) return false;
                if (percent <= h.min_k && eHP >= h.min_enemy_hp) return heal();
                return false;
            }
        })(), autoHealMPInFight: (function () {
            var lastMPHealInFight = time;
            return function () {
                var h = SETTING.HEAL_MP, percent = battle.getPercentMP(), eHP = battle.getEnemiesHP();
                if (!h.active || percent > h.min_k || eHP < 1 || (eHP < h.min_enemy_hp && percent > h.fatal_k) || (lastMPHealInFight > 0 && (lastMPHealInFight + 21) >= time)) {
                    return false;
                } else {
                    var items = slots.getItems(slots.c.MP);
                    for (var i in items) {
                        items[i].use();
                        stat.battleHealMP++;
                        lastMPHealInFight = battle.lastHealTime = time;
                        return true;
                    }
                }
                return false;
            }
        })(), getEnemyHP: function () {
            var hp = system.getMainFrameDoc().find("#game .b-control-fight__info-team.team-2 .b-control-fight__info-hp");
            hp = hp.length > 0 ? parseInt(hp.attr("data-value")) : 0;
            return isNaN(hp) || hp < 0 ? 0 : hp;
        }, amountEnemies: function (onlyLiving) {
            var l = system.getMainFrameDoc().find("#mem2 .b-control-mem__list-item-hp-value");
            if (onlyLiving === true) {
                var i = 0;
                l.each(function (j, ii) {
                    var hp = parseFloat(ii.style.width);
                    if (hp > 0) i++;
                });
                return i;
            } else {
                return l.length;
            }
        }, agre: function () {
            var s = system.getMainFrameDoc().find("#mem2 .b-control-mem__list-item-pm.anger");
            if (s.length) {
                if (!SETTING.AGRE_RANDOM || !(SETTING.AGRE_RANDOM && (Math.random() * 2 < 1))) {
                    $(s[0]).click();
                }
                battle._iii++;
            }
        }, getEnemiesHP: function () {
            var hp = system.getMainFrameDoc().find("#game .b-control-fight__info-team.team-2 .b-control-fight__info-hp");
            var sum = 0;
            var maxHP = 0;
            if (hp.length == 1) {
                var is = Math.floor(hp.attr("data-value") * 1);
                var is2 = Math.floor(hp.attr("data-value2") * 1);
                if (!isNaN(is) && is > 0) hp = is;
                if (!isNaN(is2) && is2 > 0 && is2 > maxHP) maxHP = is2;
            }
            system.getMainFrameDoc().find("#mem2 .b-control-mem__list-item-hp-value").each(function (i, ii) {
                var hp1 = parseFloat(ii.style.width);
                if (!isNaN(hp1) && hp1 > 0 && hp1 <= 100) {
                    sum += hp1 * maxHP / 100;
                }
            });
            return hp > sum ? hp : sum;
        }, getAvailableAbilities: function () {
            var abilities = system.getMainFrameDoc().find("#game [data-role=abilities] .b-control-fight__abilities-item");
            var re = {};
            abilities.each(function (i, ab) {
                ab = $(ab);
                if (SETTING.FORCE_MODE) {
                    var cdType = ab.attr("data-type");
                    if (cdType == 2 && ab.hasClass("disabled")) {
                        var cd = ab.find(".b-control-fight__abilities-item-cd")[0].innerHTML;
                        if (cd != '' && !isNaN(parseInt(cd)) && parseInt(cd) > 0) {
                            return true;
                        }
                    }
                } else {
                    if (ab.hasClass("disabled")) return true;
                }
                var id = trim(ab.attr("data-id"), "-") * 1;
                if (isNaN(id)) return true;
                var a = SETTING.BATTLE_TACTIC.getSkill(id);
                var ai = ABILITIES_INFO[id];
                if (a !== undefined && a.active && a.type == "skill" && ai.manacost <= battle.getMP()) {
                    re[id] = ab;
                }
            });
            return re;
        }, hasBuff: function (ability) {
            if (ability.type == "item") {
                var re = false;
                system.getMainFrameDoc().find("#game [data-role=pers] [data-role=effects-in] [data-title]").each(function (j, buff) {
                    var t = $(buff).attr("data-title");
                    var s = ability.id.split(" ");
                    s = s.length > 1 ? s[1] : ability.id;
                    if (t.toLowerCase().indexOf(s) > -1) {
                        re = true;
                        return false;
                    }
                });
                return re;
            } else {
                return system.getMainFrameDoc().find("#game [data-role=pers] [data-role=effects-in] [data-id=" + ability.id + "]").length > 0;
            }
        }, isAvailableItem: function (ability) {
            var items = slots.getItemByNameLike(ability.id);
            for (var i in items) {
                if (!items[i].isCooldown()) return true;
            }
            return false;
        }, getAbility: (function () {
            var cId = 0;
            var cVal = null;

            function calc() {
                var abilities = battle.getAvailableAbilities();
                var mp = battle.getMP();
                var eHP = battle.getEnemyHP(), esHP = battle.getEnemiesHP(), es = battle.amountEnemies(true);
                var a, id, ai;
                for (var i in SETTING.BATTLE_TACTIC.skills) {
                    a = SETTING.BATTLE_TACTIC.skills[i];
                    if (!a.active || es >= a.max_enemies || es <= a.min_enemies || eHP <= a.min_enemy_hp || eHP >= a.max_enemy_hp || esHP <= a.min_enemies_hp || esHP >= a.max_enemies_hp) continue;
                    id = a.id;
                    ai = a.type == "skill" ? ABILITIES_INFO[id] : ITEMS_INFO.list[id];
                    if (ai === undefined) continue;
                    if (battle.hasBuff(a)) continue;
                    if (a.type == "skill") {
                        if (mp < a.mp) continue;
                        if (abilities[id] === undefined) continue;
                        if (!SETTING.FORCE_MODE && abilities[id].hasClass("disabled")) return undefined;
                    } else if (a.type == "item") {
                        if (!battle.isAvailableItem(a)) continue;
                    }
                    if (a.after > 0) {
                        if (abilities[a.after] !== undefined) {
                            return a;
                        } else {
                            continue;
                        }
                    }
                    return a;
                }
                return undefined;
            }

            return function () {
                if (cId == battle.cashId && cId) {
                    return cVal;
                } else {
                    cId = battle.cashId;
                    cVal = calc();
                    return cVal;
                }
            }
        })(), useAbility: function (ability) {
            var id = ability.type == "skill" ? -ability.id : ability.id;
            system.getMainFrame().fight.useAbility(id);
        }, activateBattleAbility: function (ability) {
            var obj = system.getMainFrameDoc().find("#game [data-role=abilities] .b-control-fight__abilities-item[data-id=-" + ability.id + "]");
            if (obj.length) {
                obj.click();
                return true;
            } else {
                return false;
            }
        }, _iii: 0, attack: function (notFinish) {
            if (battle._iii < SETTING.AGRE_LIMIT) battle.agre();
            var ability = battle.getAbility();
            if (ability !== undefined) {
                if (ability.last !== true) ability.last = false;
                if (notFinish && ability.last) return false;
                switch (ability.type) {
                    case"item":
                        var items = slots.getItemByNameLike(ability.id);
                        if (items.length == 0) {
                            console.log("BOT: ACTIVATE EMPTY SLOT! Ошибка на уровне battle.getAbility()");
                            return false;
                        }
                        items[0].use();
                        break;
                    case"skill":
                        if (battle.activateBattleAbility(ability)) {
                            if (ability.last) {
                                battle.skips = Math.max(battle.skips, 10);
                            }
                            return true;
                        }
                        break;
                    default:
                        error("type was not detected");
                }
            }
            return false;
        }, fightStep: (function () {
            function step() {
                if (battle.getEnemyHP() < 1) return false;
                if (battle.autoHealHPInFight()) {
                    battle.skips = Math.max(battle.skips, 10);
                    return true;
                }
                if (battle.autoHealMPInFight()) {
                    battle.skips = Math.max(battle.skips, 10);
                    return true;
                }
                if (battle.attack(true)) return true;
                return !battle.waitHeal() && battle.attack();
            }

            return function () {
                var re = step();
                if (re) {
                    battle.skips = Math.max(battle.skips, 3);
                }
                return re;
            }
        })(), controls: (function () {
            var FLAG_DIE_RESURRECT = 1, FLAG_DIE_LOGOUT = 2;

            function worker() {
                if (battle.skips > 0) battle.skips--;
                if (system.DATA_ERROR) {
                    system.reloadGeneralFrame();
                    return;
                }
                if (!system.ready()) {
                    return;
                }
                bLog.scan(battle.inFight());
                if (battle.skips > 0) return;
                if (battle.getHP() == 0) {
                    battle.controls.stop();
                    if (SETTING.DIE_ACTION & FLAG_DIE_RESURRECT) {
                        system.resurrect();
                    }
                    if (SETTING.DIE_ACTION & FLAG_DIE_LOGOUT) {
                        setTimeout(system.logout, 5000);
                    }
                    return;
                }
                battle.cashId = Math.random();
                if (battle.isFinish()) {
                    console.log('save stat');
                    battle.saveBattleStat();
                } else if (battle.inFight()) {
                    battle.fightStep();
                } else if (battle.isReadyForBattle()) {
                    battle.attackMob();
                } else {
                    console.log('heal after fight');
                    battle.autoHealAfterFight();
                    battle.skips = Math.max(battle.skips, 10);
                }
                battle.cashId = 0;
                if (system.DATA_ERROR) {
                    system.reloadGeneralFrame();
                }
            }

            var intervalId = null;
            var button = null;

            function isStarted() {
                return intervalId !== null;
            }

            function start() {
                if (!intervalId) {
                    farm.controls.stop();
                    this.stop();
                    battle.skips = 0;
                    system.WAIT_USE_ITEMS = 0;
                    intervalId = setInterval(worker, 100);
                    button.text("battle ON");
                    button.css({"background-color": "green"});
                }
            }

            function stop() {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                    button.text("battle OFF");
                    button.css({"background-color": "red"});
                }
            }

            function switcher() {
                intervalId ? stop() : start();
            }

            var self = this;
            return {
                isStarted: isStarted.bind(self),
                start: start.bind(self),
                stop: stop.bind(self),
                switcher: switcher.bind(self),
                setButton: function (obj) {
                    button = obj;
                }
            }
        })()
    };
    var farm = {
        skips: 0,
        isPorez: false,
        stopError: "",
        porezMsg: "У Вас нет необходимого инструмента!",
        locRequestInterval: 2200,
        isStarted: false,
        farmNow: null,
        trueFarm: false,
        getBeginFarmURL: function (num) {
            return getLocationInfoURL() + "?mode=farm&action=chek&lid=1&num=" + num;
        },
        onLoadMapInfo: function (d) {
            if ((typeof d == "object") && (d instanceof XMLDocument)) {
                var resources = SETTING.FARM_RESOURCES;
                var o, isFarmNow, str = '', i;
                for (i = 0; i < resources.length; i++) {
                    if (str != '') str += ',';
                    str += "farm item[artikul_id=" + resources[i].type + "]";
                }
                o = $(d).find(str);
                isFarmNow = false;
                if (farm.farmNow > 0) {
                    o.each(function (i, item) {
                        item = $(item);
                        if ((item.attr("farming") == "1") && (item.attr("num") * 1 == farm.farmNow)) {
                            isFarmNow = true;
                            farm.trueFarm = true;
                            return false;
                        }
                    });
                }
                if (!isFarmNow) {
                    var issetFree = false;
                    for (i = 0; i < resources.length; i++) {
                        o = $(d).find("farm item[artikul_id=" + resources[i].type + "]");
                        o.each(function (i, item) {
                            item = $(item);
                            var num = item.attr("num") * 1;
                            if ((item.attr("farming") == "0") && !isNaN(num) && (num > 0)) {
                                loadXML(farm.getBeginFarmURL(num), farm.successFarm);
                                farm.farmNow = num;
                                if (farm.trueFarm) {
                                    stat.farms++;
                                }
                                issetFree = true;
                                farm.trueFarm = false;
                                return false;
                            }
                        });
                        if (issetFree) break;
                    }
                }
            } else {
                error("XML request NOT instance XMLDocument (farm.onLoadMapInfo)");
            }
        },
        successFarm: function (d) {
            if ((typeof d == "object") && (d instanceof XMLDocument)) {
                var i = $(d.getElementsByTagName("req"));
                if (i.length == 1) {
                    if (i.attr("status") == "0") {
                        if (i.attr("msg") == farm.porezMsg) {
                            farm.controls.stop();
                            farm.isPorez = true;
                            farm.stopError = i.attr("msg");
                        } else {
                            farm.stopError = i.attr("msg");
                            farm.controls.stop();
                        }
                        farm.farmNow = null;
                    }
                } else {
                    error("XML request incorrect (farm.successFarm)");
                }
            } else {
                error("XML request NOT instance XMLDocument (farm.successFarm)");
            }
        },
        cancelFarm: function () {
            loadXML(getLocationInfoURL() + "?mode=farm&action=cancel");
        },
        controls: (function () {
            var button = null;

            function worker() {
                if (farm.skips > 0) {
                    farm.skips--;
                    return;
                }
                farm.skips = farm.locRequestInterval / 100;
                if (battle.isFinish()) {
                    battle.saveBattleStat();
                    loadXML(getLocationInfoURL(), farm.onLoadMapInfo);
                } else if (battle.inFight()) {
                    farm.skips = 0;
                    battle.fightStep();
                } else {
                    loadXML(getLocationInfoURL(), farm.onLoadMapInfo);
                }
            }

            var intervalId = null;

            function isStarted() {
                return intervalId !== null;
            }

            function start() {
                if (!intervalId) {
                    battle.controls.stop();
                    farm.isPorez = false;
                    farm.skips = 0;
                    farm.stopError = '';
                    intervalId = setInterval(worker, 100);
                    button.text("farm ON");
                    button.css({"background-color": "green"});
                }
            }

            function stop() {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                    farm.cancelFarm();
                    button.text("farm OFF");
                    button.css({"background-color": "red"});
                }
            }

            function switcher() {
                intervalId !== null ? stop() : start();
            }

            var self = this;
            return {
                isStarted: isStarted.bind(self),
                start: start.bind(self),
                stop: stop.bind(self),
                switcher: switcher.bind(self),
                setButton: function (obj) {
                    button = obj;
                }
            }
        })()
    };
    (function () {
        function init() {
            if (XMLDocument === undefined) {
                alert("FATAL ERROR: not found XMLDocument");
                return;
            }
            (function () {
                USER_LVL = (function (l) {
                    if (l.length) {
                        return l[0].innerHTML * 1;
                    } else {
                        l = 0;
                        while (l = prompt("Не удадлось определить уровень персонажа\r\nУкажите Ваш уровень:")) {
                            l = Math.round(l * 1);
                            if (!isNaN(l) && l >= 1 && l <= 20) return l;
                        }
                    }
                })(system.getGeneralFrameDoc().find("#control-lvl .b-control-lvl__level"));
                (function (href) {
                    system.abilities.load(function () {
                        system.inventory.load(null, href);
                    });
                })(system.getMainFrame().location.href);
            })();
            (function () {
                function setPercent(n) {
                    n = n * 1;
                    if (isNaN(n)) return 1;
                    return n > 100 ? 100 : (n < 0 ? 1 : n);
                }

                function setInt(number, min, max, nanValue) {
                    if (nanValue === undefined) nanValue = min;
                    var n = number * 1;
                    if (isNaN(n)) return nanValue;
                    return n > max ? max : (n < min) ? min : n;
                }

                var w = $("<div id='__bot' style='position:fixed;top:0;left:0;opacity:0.9;overflow:hidden;background-color:#fff;width:100%;'></div>");
                $(window.top.document).find("body").prepend(w);
                (function () {
                    var buttonFarm = $("<a class='b-smart button-battle' style='min-width:80px;display:block;box-sizing:border-box;float:left;border-bottom:1px solid #000;border-right:1px solid #000;width:10%;height:16px;color:#fff;font-weight: bold;font-size:11px;background-color:red;text-align:center;'>farm OFF</a>");
                    buttonFarm.on("click", function () {
                        farm.controls.switcher();
                    });
                    farm.controls.setButton(buttonFarm);
                    var buttonBattle = $("<a class='b-smart button-battle' style='min-width:80px;display:block;box-sizing:border-box;float:left;border-bottom:1px solid #000;border-right:1px solid #000;width:10%;height:16px;color:#fff;font-weight: bold;font-size:11px;background-color:red;text-align:center;'>battle OFF</a>");
                    buttonBattle.on("click", function () {
                        battle.controls.switcher();
                    });
                    battle.controls.setButton(buttonBattle);
                    statBlock = $("<div style='display:block;float:left;width:88%;padding:0 1%;height:16px;line-height:16px;color:#723920;font-size:11px;background-color:#ffd7a6;'></div>");
                    battleStatBlock = $("<div style='display:block;float:left;width:88%;padding:0 1%;height:16px;line-height: 16px;color:#723920;font-size:11px;background-color:#ffd7a6;'>BATTLE STATISTIC</div>");
                    w.append(buttonFarm);
                    w.append(statBlock);
                    w.append(buttonBattle);
                    w.append(battleStatBlock);
                    var hideLink = $("<a class='b-smart g-control' style='width:80px;'>скрыть</a>");
                    hideLink.on("click", function () {
                        w.hasClass("b-hide") ? w.removeClass("b-hide") : w.addClass("b-hide");
                    });
                    w.append(hideLink);
                    var clearStatistic = $("<a class='g-control'>сбросить статистику</a>");
                    clearStatistic.on("click", _stat.clearStat);
                    w.append(clearStatistic);
                    var navigationButton = $("<a class='g-control off' title='Автоматически переходит по компасу'>Автонавигация (выкл.)</a>");
                    navigationButton.on("click", (function () {
                        var compassInterval = null;

                        function go() {
                            system.getMainFrameDoc().find("#control-area [data-role=list] .compass").click();
                        }

                        return function () {
                            if (compassInterval === null) {
                                go();
                                compassInterval = setInterval(go, 2000);
                                navigationButton.addClass("on").removeClass("off").text("Автонавигация (вкл.)");
                            } else {
                                clearInterval(compassInterval);
                                compassInterval = null;
                                navigationButton.addClass("off").removeClass("on").text("Автонавигация (выкл.)");
                            }
                        }
                    })());
                    w.append(navigationButton);
                })();
                var tabWrap = $("<div class='hide' style='width:100%;height:auto;box-sizing: border-box;margin:0;'></div>");
                var butWrap = $("<div></div>");
                var optionTabs = {
                    battleSettings: $("<div class='b-tab hide'></div>"),
                    healAfterBattle: $("<div class='b-tab hide'></div>"),
                    battleTactic: $("<div class='b-tab hide'></div>"),
                    targets: $("<div class='b-tab hide'></div>"),
                    export: $("<div class='b-tab hide'></div>"),
                    stat: $("<div class='b-tab hide'></div>")
                };
                var tabButtons = {
                    targets: $("<a class='g-control'>цели</a>"),
                    battleSettings: $("<a class='g-control'>настройки боя</a>"),
                    healAfterBattle: $("<a class='g-control'>хил после боя</a>"),
                    battleTactic: $("<a class='g-control'>тактика боя</a>"),
                    export: $("<a class='g-control'>Импорт/экспорт</a>"),
                    stat: $("<a class='g-control'>СТАТИСТИКА</a>")
                };
                (function () {
                    function showTab(tab) {
                        return function () {
                            var o = $(tab), p = o.parent();
                            if (o.hasClass("hide")) {
                                p.removeClass("hide");
                                p.find(".b-tab").addClass("hide");
                                o.removeClass("hide");
                            } else {
                                o.addClass("hide");
                                p.addClass("hide");
                            }
                        }
                    }

                    var k;
                    for (k in optionTabs) tabWrap.append(optionTabs[k]);
                    for (k in tabButtons) tabButtons[k].on("click", showTab(optionTabs[k])).appendTo(butWrap);
                })();
                (function () {
                    var tab = optionTabs.battleSettings;

                    function content() {
                        tab.empty();
                        tab.append("<h2 class='tab-title'>Настройки боя</h2>");
                        var sFields = {
                            min_hp_for_attack: $("<div class='b-float-block'>Мин. ХП для атаки (1-100): <input type='text' maxlength='3' value='" + SETTING.MIN_HP_FOR_ATTACK + "' size='3'> %</div>"),
                            min_mp_for_attack: $("<div class='b-float-block'>Мин. МП для атаки (1-100): <input type='text' maxlength='3' value='" + SETTING.MIN_MP_FOR_ATTACK + "' size='3'> %</div>"),
                            attack_alone_mobs: $("<div class='b-float-block'><input type='checkbox' " + (SETTING.LIKE_ALONE_MOBS ? "checked" : "") + "> Атаковать одиноких мобов</div>"),
                            die_action: $("<div class='b-float-block'>Действие в случае смерти: <select><option value='0' " + (SETTING.DIE_ACTION == 0 ? "selected" : "") + ">Ничего не делать</option><option value='1' " + (SETTING.DIE_ACTION == 1 ? "selected" : "") + ">Воскреснуть в городе</option><option value='2' " + (SETTING.DIE_ACTION == 2 ? "selected" : "") + ">Выйти из игры</option><option value='3' " + (SETTING.DIE_ACTION == 3 ? "selected" : "") + ">Воскреснуть и выйти</option></select></div>"),
                            heal_timeout_sec: $("<div class='b-float-block'>Мин. таймаут хила в бою (1-999): <input type='text' maxlength='3' value='" + SETTING.HEAL_IN_FIGHT_TIMEOUT_SEC + "' size='3'></div>"),
                            agre_mobs: $("<div class='b-float-block'>Агрить мобов: <input type='text' maxlength='2' value='" + SETTING.AGRE_LIMIT + "' size='2'> <input type='checkbox' size='2'" + (SETTING.AGRE_RANDOM ? " checked" : "") + "> рандомно <i>(от 0 до заданного значения)</i></div>"),
                            force_mode: $("<div class='b-float-block' style='color:red;'>Турбо режим: <input type='checkbox' size='2'" + (SETTING.FORCE_MODE ? " checked" : "") + "> (будет быстрее принимать решение, может допускать ошибки в тактике)</div>"),
                            heal_hp: $("<div class='b-float-block'><input type='checkbox' size='2'" + (SETTING.HEAL_HP.active ? " checked" : "") + "> Использовать <b>нектары жизни</b> в бою если здоровье опуститься ниже <input type='text' maxlength='2' value='" + Math.round(SETTING.HEAL_HP.min_k * 100) + "' size='2'> <b>%</b> при том, что общее здоровье противников больше <input type='text' maxlength='4' value='" + SETTING.HEAL_HP.min_enemy_hp + "' size='4'> <b>hp</b> или если моё здоровье опуститься ниже фатального значения <input type='text' maxlength='2' value='" + Math.round(SETTING.HEAL_HP.fatal_k * 100) + "' size='2'> <b>%</b> <i>(в этом случае время мин. использования будет уменьшено в 2 раза)</i></div>"),
                            heal_mp: $("<div class='b-float-block'><input type='checkbox' size='2'" + (SETTING.HEAL_MP.active ? " checked" : "") + "> Использовать <b>нектары удали</b> в бою если удаль опуститься ниже <input type='text' maxlength='2' value='" + Math.round(SETTING.HEAL_MP.min_k * 100) + "' size='2'> <b>%</b> при том, что общее здоровье противников больше <input type='text' maxlength='4' value='" + SETTING.HEAL_MP.min_enemy_hp + "' size='4'> <b>hp</b> или если моя удаль опуститься ниже фатального значения <input type='text' maxlength='2' value='" + Math.round(SETTING.HEAL_MP.fatal_k * 100) + "' size='2'> <b>%</b> <i>(в этом случае время мин. использования будет уменьшено в 2 раза)</i></div>"),
                            heal_hp_after_fight: null,
                            heal_mp_after_fight: null
                        };
                        tab.append(sFields.min_hp_for_attack);
                        tab.append(sFields.heal_timeout_sec);
                        tab.append(sFields.attack_alone_mobs);
                        tab.append(sFields.die_action);
                        tab.append("<div class='b-cl'></div>");
                        tab.append(sFields.min_mp_for_attack);
                        tab.append(sFields.agre_mobs);
                        tab.append(sFields.force_mode);
                        tab.append("<div class='b-cl'></div>");
                        tab.append(sFields.heal_hp);
                        tab.append("<div class='b-cl'></div>");
                        tab.append(sFields.heal_mp);
                        tab.append("<div class='b-cl'></div>");
                        tab.append("<div class='b-float-block'><i>*Нектары будут использоваться по порядку, как расположены в слотах (от первого к последнему), в случае если кулдаун не пройдёт, а в другом слоте будет альтернативный нектар без кулдауна, тогда будет использован он</i></div>");
                        tab.append("<div class='b-cl'></div>");
                        sFields.min_hp_for_attack = sFields.min_hp_for_attack.find("input")[0];
                        sFields.min_mp_for_attack = sFields.min_mp_for_attack.find("input")[0];
                        sFields.attack_alone_mobs = sFields.attack_alone_mobs.find("input")[0];
                        sFields.die_action = sFields.die_action.find("select")[0];
                        sFields.heal_timeout_sec = sFields.heal_timeout_sec.find("input")[0];
                        sFields.agre_mobs = sFields.agre_mobs.find("input");
                        sFields.force_mode = sFields.force_mode.find("input")[0];
                        sFields.heal_hp = sFields.heal_hp.find("input");
                        sFields.heal_mp = sFields.heal_mp.find("input");
                        tab.append("<div class='b-cl'></div>");
                        tab.append("<div class='b-cl'></div>");
                        var resetSetting = $("<a class='b-button'>Сбросить заполнение</a>");
                        var setSetting = $("<a class='b-button'>Применить</a>");
                        setSetting.on("click", function () {
                            SETTING.MIN_HP_FOR_ATTACK = sFields.min_hp_for_attack.value = setPercent(sFields.min_hp_for_attack.value);
                            SETTING.MIN_MP_FOR_ATTACK = sFields.min_mp_for_attack.value = setPercent(sFields.min_mp_for_attack.value);
                            SETTING.LIKE_ALONE_MOBS = sFields.attack_alone_mobs.checked;
                            SETTING.DIE_ACTION = sFields.die_action.value;
                            SETTING.HEAL_IN_FIGHT_TIMEOUT_SEC = sFields.heal_timeout_sec.value = setInt(sFields.heal_timeout_sec.value, 1, 999, 999);
                            SETTING.AGRE_LIMIT = sFields.agre_mobs[0].value = setInt(sFields.agre_mobs[0].value, 0, 20, 0);
                            SETTING.AGRE_RANDOM = sFields.agre_mobs[1].checked;
                            SETTING.FORCE_MODE = sFields.force_mode.checked;
                            SETTING.HEAL_HP.active = sFields.heal_hp[0].checked;
                            SETTING.HEAL_HP.min_k = sFields.heal_hp[1].value = setInt(sFields.heal_hp[1].value, 0, 99, 0);
                            SETTING.HEAL_HP.min_k /= 100;
                            SETTING.HEAL_HP.min_enemy_hp = sFields.heal_hp[2].value = setInt(sFields.heal_hp[2].value, 0, 9999, 0);
                            SETTING.HEAL_HP.fatal_k = sFields.heal_hp[3].value = setInt(sFields.heal_hp[3].value, 0, 99, 0);
                            SETTING.HEAL_HP.fatal_k /= 100;
                            SETTING.HEAL_MP.active = sFields.heal_mp[0].checked;
                            SETTING.HEAL_MP.min_k = sFields.heal_mp[1].value = setInt(sFields.heal_mp[1].value, 0, 99, 0);
                            SETTING.HEAL_MP.min_k /= 100;
                            SETTING.HEAL_MP.min_enemy_hp = sFields.heal_mp[2].value = setInt(sFields.heal_mp[2].value, 0, 9999, 0);
                            SETTING.HEAL_MP.fatal_k = sFields.heal_mp[3].value = setInt(sFields.heal_mp[3].value, 0, 99, 0);
                            SETTING.HEAL_MP.fatal_k /= 100;
                        });
                        resetSetting.on("click", content);
                        tab.append(setSetting);
                        tab.append(resetSetting);
                        tab.append("<div class='b-cl'></div>");
                    }

                    content();
                })();
                (function () {
                    var tab = optionTabs.healAfterBattle;
                    var interval = 0;

                    function content() {
                        tab.empty();
                        tab.append("<h2 class='tab-title'>Настройки лечения после боя</h2>");
                        var ii = INVENTORY_INFO[1];
                        if (ii !== undefined) {
                            var id, t;
                            var re = "<div style='padding:5px;width:100%;'>";
                            re += "<h3 class='tab-title'>Напитки (бурдюки) найденные в вашем инвентаре <a data-action='refresh'>Обновить?</a> (только в не боя)</h3>";
                            for (id in ii) {
                                t = ii[id];
                                re += "<div style='width:50px;margin:5px;float:left;font-size:9px;text-align:center;'>";
                                re += "<div style='width:40px;padding:0 5px;height:40px;' class='b-tt'>";
                                re += "<img data-action='b-add-heal' data-name='" + t.name + "' src='" + t.image + "' title='" + t.desc + "' style='width:40px;height:40px;cursor:pointer;'>";
                                re += "</div>";
                                re += t.count + " шт.<br>";
                                re += t.name;
                                re += "</div>";
                            }
                            re += "</div>";
                            re += "<div class='b-cl'></div>";
                            re += "<h3 class='tab-title'>Настройка использования напитков <a data-action='add-item'>Добавить +</a> <a data-action='save'>Сохранить</a></h3>";
                            re = $(re);
                            var wrap = $("<div style='padding:5px;width:100%;height:300px;overflow:auto;box-sizing:border-box;border-top:1px solid #999;border-bottom:1px solid #999;'>");
                            re.find("[data-action='refresh']").on("click", (function (f) {
                                return function () {
                                    system.inventory.load(function () {
                                        f();
                                    });
                                }
                            })(content));
                            re.find("[data-action='save']").on("click", (function (f) {
                                return function () {
                                    SETTING.HEAL_AFTER_FIGHT = {HP: {}, MP: {}};
                                    wrap.find("[data-type='b-haf-item']").each(function (i, h) {
                                        var sel = $(h).find("select");
                                        var input = $(h).find("input");
                                        var type = sel[0].value;
                                        var hp = setInt(input[0].value, 1, 99, 50);
                                        var val;
                                        for (i = 1; i < 4; i++) {
                                            val = sel[i].value;
                                            if (val) {
                                                if (SETTING.HEAL_AFTER_FIGHT[type][hp] === undefined) {
                                                    SETTING.HEAL_AFTER_FIGHT[type][hp] = {};
                                                }
                                                if (SETTING.HEAL_AFTER_FIGHT[type][hp][val] === undefined) {
                                                    SETTING.HEAL_AFTER_FIGHT[type][hp][val] = 1;
                                                } else {
                                                    SETTING.HEAL_AFTER_FIGHT[type][hp][val]++;
                                                }
                                            }
                                        }
                                    });
                                    transportHAF();
                                    f();
                                }
                            })(content));

                            function appendHAF(type, hp, target1, target2, target3) {
                                var thp = type == 'HP' ? " selected" : "";
                                var tmp = type == 'MP' ? " selected" : "";
                                var re = "<div class='b-ability' data-type='b-haf-item' style='width:1200px;'>";
                                re += "<div class='b-and'>ЕСЛИ</div>";
                                re += "<div class='b-and'>ваше(а) </div>";
                                re += "<div class='b-skill-cond-wrap'>&nbsp;<select><option value='HP'" + thp + ">Здоровье</option><option value='MP'" + tmp + ">Удаль</option></select></div>";
                                re += "<div class='b-and'>&lt;</div>";
                                re += "<div class='b-skill-cond-wrap'><input type='text' size='2' maxlength='2' value='" + hp + "'> %</div>";
                                re += "<div class='b-and'>использовать</div>";
                                var target;
                                var id, t, pr = false, sel, ii = INVENTORY_INFO[1];
                                for (i = 0; i < 3; i++) {
                                    switch (i) {
                                        case 0:
                                            target = target1;
                                            break;
                                        case 1:
                                            target = target2;
                                            break;
                                        case 2:
                                            target = target3;
                                            break;
                                    }
                                    if (i > 0) re += "<div class='b-and'>И</div>";
                                    if (!target) {
                                        sel = ' selected';
                                        target = '';
                                        pr = true;
                                    } else {
                                        sel = '';
                                        pr = false;
                                    }
                                    re += "<div class='b-skill-cond-wrap'>&nbsp;<select><option value=''" + sel + ">-</option>";
                                    for (id in ii) {
                                        t = ii[id];
                                        sel = "";
                                        if (t.name == target) {
                                            sel = " selected";
                                            pr = true;
                                        }
                                        re += "<option value='" + t.name + "'" + sel + ">" + t.name + "</option>";
                                    }
                                    if (!pr) {
                                        re += "<option value='" + target + "' selected>" + target + "</option>";
                                    }
                                    re += "</select></div>";
                                }
                                re += "</div>";
                                re += "<div class='b-cl'></div>";
                                return re;
                            }

                            function generateHAFs() {
                                var haf = SETTING.HEAL_AFTER_FIGHT;
                                var type, hp, name, amount, items, i;
                                var re = '';
                                for (type in haf) {
                                    for (hp in haf[type]) {
                                        items = [];
                                        for (name in haf[type][hp]) {
                                            amount = haf[type][hp][name];
                                            for (i = amount; i > 0; i--) {
                                                items.push(name);
                                            }
                                        }
                                        re += appendHAF(type, hp, items[0], items[1], items[2]);
                                    }
                                }
                                return re;
                            }

                            function transportHAF() {
                                var ii = INVENTORY_INFO[1];
                                var haf = SETTING.HEAL_AFTER_FIGHT;
                                var fh = SETTING.FREE_HEALS;
                                var type, hp, name, count;
                                var id;
                                for (type in haf) {
                                    fh[type] = {};
                                    for (hp in haf[type]) {
                                        fh[type][hp] = {};
                                        for (name in haf[type][hp]) {
                                            if (ii[name] !== undefined) {
                                                id = ii[name].id;
                                            } else {
                                                continue;
                                            }
                                            fh[type][hp][id] = haf[type][hp][name];
                                        }
                                    }
                                }
                            }

                            re.find("[data-action='add-item']").on("click", function () {
                                wrap.append(appendHAF('HP', 50, '', '', ''));
                            });
                            wrap.append(generateHAFs());
                            tab.append(re);
                            tab.append(wrap);
                            tab.append("<p>*всегда будет использоваться минимальный вариант допустим у вас есть настройка для здоровья меньше 20% и меньше 60%, если у вас 15% здоровья то будет выбран вариант для меньше 20%.<br>**так же Вы можете использовать одновременно несколько одинаковых бурдюков<br>***нельзя указывать различные варианты для одного показателя здоровья или удали - после сохранения лишний вариант будет удалён</p>");
                            clearInterval(interval);
                        } else {
                            tab.append("<h2>Информация о бурдюках и других напитках загружается... (если вы в бою, для загрузки завершите бой)</h2>");
                        }
                    }

                    content();
                    interval = setInterval(content, 1000);
                })();
                (function () {
                    var tab = optionTabs.battleTactic;
                    var interval = 0;

                    function content() {
                        tab.empty();
                        tab.append("<h2 class='tab-title'>Тактика боя</h2>");
                        var isInit = false;
                        var counter = 0, o;
                        for (o in ABILITIES_INFO) counter++;
                        if (counter > 1) {
                            var ai = ABILITIES_INFO, bt = SETTING.BATTLE_TACTIC;
                            var re = "", a, i, k, id, params, slot;
                            for (k in bt.skills) {
                                isInit = true;
                                if (bt.skills[k].type === "skill") {
                                    id = bt.skills[k].id;
                                    if (ai[id] === undefined) {
                                        delete(bt.skills[k]);
                                    }
                                } else if (bt.skills[k].type !== "item") {
                                    delete(bt.skills[k]);
                                }
                            }

                            function addAbil(id, active) {
                                bt.skills.splice(0, 0, {
                                    id: id,
                                    type: "skill",
                                    active: (active === true),
                                    after: 0,
                                    not_found: 0,
                                    min_enemy_hp: 0,
                                    min_enemies: 0,
                                    min_enemies_hp: 0,
                                    max_enemy_hp: 9999999,
                                    max_enemies: 999,
                                    max_enemies_hp: 999999999,
                                    info: ai[id]
                                });
                            }

                            function addItem(id, active) {
                                bt.skills.splice(0, 0, {
                                    id: id,
                                    type: "item",
                                    active: (active === true),
                                    after: 0,
                                    not_found: 0,
                                    min_enemy_hp: 0,
                                    min_enemies: 0,
                                    min_enemies_hp: 0,
                                    max_enemy_hp: 9999999,
                                    max_enemies: 999,
                                    max_enemies_hp: 999999999
                                });
                            }

                            if (bt.skills.length < 2) {
                                for (id in ai) {
                                    a = ai[id];
                                    if (bt.getSkill(id) !== undefined) continue;
                                    addAbil(id, !isInit);
                                }
                            }
                            if (!isInit) {
                                bt.skills.sort(function (a, b) {
                                    a = ai[a.id];
                                    b = ai[b.id];
                                    if (a.skipStep != b.skipStep) return a.skipStep ? 1 : -1;
                                    if (a.needStep != b.needStep) return a.needStep ? 1 : -1;
                                    if (a.manacost == b.manacost) return 0;
                                    return a.manacost < b.manacost ? 1 : -1;
                                });
                            }
                            re += "<div style='padding:5px;width:100%;'>";
                            re += "<h3 class='tab-title'>Доступные способности и предметы <a data-action='refresh'>Обновить</a> (только вне боя)</h3>";
                            for (i in ai) {
                                re += abilBlock(ai[i]);
                            }
                            ITEMS_INFO.refreshItemsInfo();
                            var items = ITEMS_INFO.getItems(slots.c.ALL);
                            for (i in items) {
                                re += itemBlock(items[i]);
                            }
                            re += "<div class='b-cl'></div>";
                            re += "</div>";

                            function saveBT() {
                                bt.skills = [];
                                tab.find("[data-type=b-ability]").each(function (i, a) {
                                    a = $(a);
                                    id = a.attr("data-id");
                                    bt.skills.push({
                                        id: id,
                                        type: a.attr("data-skill-type"),
                                        active: a.find("input[name=active]")[0].checked,
                                        after: a.find("select[name=after]")[0].value,
                                        not_found: a.find("select[name=not-found]")[0].value,
                                        min_enemy_hp: setInt(a.find("input[name=min_enemy_hp]")[0].value, 0, 9999999, 0),
                                        min_enemies: setInt(a.find("input[name=min_enemies]")[0].value, 0, 999, 0),
                                        min_enemies_hp: setInt(a.find("input[name=min_enemies_hp]")[0].value, 0, 999999999, 0),
                                        max_enemy_hp: setInt(a.find("input[name=max_enemy_hp]")[0].value, 0, 9999999, 0),
                                        max_enemies: setInt(a.find("input[name=max_enemies]")[0].value, 0, 999, 0),
                                        max_enemies_hp: setInt(a.find("input[name=max_enemies_hp]")[0].value, 0, 999999999, 0)
                                    });
                                });
                                content();
                            }

                            function abilBlock(info) {
                                var i = info;
                                var re = "<div style='width:50px;margin:5px;float:left;font-size:9px;text-align:center;'>";
                                re += "<div style='width:40px;padding:0 5px;height:40px;' class='b-tt'><img data-action='b-add-abil' data-id='" + i.id + "' src='" + i.image + "' title='" + i.title + "' style='width:40px;height:40px;cursor:pointer;'></div>";
                                re += i.manacost + " MP<br>";
                                re += "</div>";
                                return re;
                            }

                            function itemBlock(info) {
                                var i = info;
                                var re = "<div style='width:50px;margin:5px;float:left;font-size:9px;text-align:center;'>";
                                re += "<div style='width:40px;padding:0 5px;height:40px;' class='b-tt'><img data-action='b-add-item' data-id='" + i.id + "' src='" + i.image + "' style='width:40px;height:40px;cursor:pointer;'></div>";
                                re += "</div>";
                                return re;
                            }

                            function conditionBlock(param) {
                                var j;
                                var p = param;
                                var re = "";
                                var a = p.type == "skill" ? ai[p.id] : items[p.id];
                                if (a === undefined) {
                                    console.log(items);
                                    console.log(param);
                                    console.log(p.id);
                                }
                                re += "<div class='b-ability' data-type='b-ability' data-id='" + p.id + "' data-skill-type='" + p.type + "' style='width:2000px;'>";
                                re += '<a class="b-skill-cond-wrap" onclick="$(this).parent().remove();">X</a>';
                                re += "<img src='" + a.image + "' style='float:left;height:40px;'>";
                                re += "<div class='b-skill-cond-wrap'>УСЛОВИЯ: </div>";
                                re += "<div class='b-skill-cond-wrap'>";
                                re += "<input name='active' type='checkbox' " + (p.active ? "checked" : "") + " style='height:40px;'>";
                                re += "</div>";
                                re += "<div class='b-and'>И</div>";
                                re += "<div class='b-skill-cond-wrap'>";
                                re += "только перед: ";
                                re += "<select name='after'>";
                                re += "<option value='0'>не важно</option>";
                                for (j in ai) {
                                    if (id == j) continue;
                                    re += "<option value='" + j + "' " + (p.after == j ? "selected" : "") + ">[MP " + ai[j].manacost + "] " + ai[j].title + "</option>";
                                }
                                re += "</select>";
                                re += "</div>";
                                re += "<div class='b-and'>И</div>";
                                re += "<div class='b-skill-cond-wrap'>";
                                re += "только если отсутствует: ";
                                re += "<select name='not-found'>";
                                re += "<option value='0'>не важно</option>";
                                for (j in items) {
                                    if (id == j) continue;
                                    re += "<option value='" + j + "' " + (p.not_found == j ? "selected" : "") + ">" + j + "</option>";
                                }
                                re += "</select>";
                                re += "</div>";
                                re += "<div class='b-and'>И</div>";
                                re += "<div class='b-skill-cond-wrap'>";
                                re += "<input type='text' maxlength='7' name='min_enemy_hp' value='" + p.min_enemy_hp + "' style='width:60px;'>";
                                re += " <b>&lt;</b> ХП противника <b>&lt;</b> ";
                                re += "<input type='text' maxlength='7' name='max_enemy_hp' value='" + p.max_enemy_hp + "' style='width:60px;'>";
                                re += "</div>";
                                re += "<div class='b-and'>И</div>";
                                re += "<div class='b-skill-cond-wrap'>";
                                re += "<input type='text' maxlength='3' name='min_enemies' value='" + p.min_enemies + "' style='width:34px;'>";
                                re += " <b>&lt;</b> кол-во противников <b>&lt;</b> ";
                                re += "<input type='text' maxlength='3' name='max_enemies' value='" + p.max_enemies + "' style='width:34px;'>";
                                re += "</div>";
                                re += "<div class='b-and'>И</div>";
                                re += "<div class='b-skill-cond-wrap'>";
                                re += "<input type='text' maxlength='9' name='min_enemies_hp' value='" + p.min_enemies_hp + "' style='width:72px;'>";
                                re += " <b>&lt;</b>общее ХП противников <b>&lt;</b> ";
                                re += "<input type='text' maxlength='9' name='max_enemies_hp' value='" + p.max_enemies_hp + "' style='width:72px;'>";
                                re += "</div>";
                                re += "<div class='b-cl'></div>";
                                re += "</div>";
                                return re;
                            }

                            re += "<div class='b-sort' style='padding:5px;width:100%;height:300px;overflow:auto;box-sizing:border-box;border-top:1px solid #999;border-bottom:1px solid #999;'>";
                            for (i in bt.skills) {
                                re += conditionBlock(bt.skills[i]);
                            }
                            re += "<div class='b-cl'></div>";
                            re += "</div>";
                            re = $(re);
                            re.find("[data-action=refresh]").on("click", function () {
                                if (!battle.inFight()) {
                                    system.abilities.reload((function (f) {
                                        return function () {
                                            f();
                                        }
                                    })(content));
                                }
                            });
                            tab.append(re);
                            tab.find("[data-action=b-add-item]").on("click", function () {
                                saveBT();
                                var id = $(this).attr("data-id");
                                addItem(id, true);
                                content();
                            });
                            tab.find("[data-action=b-add-abil]").on("click", function () {
                                saveBT();
                                var id = $(this).attr("data-id");
                                addAbil(id, true);
                                content();
                            });
                            tab.append("<div class='b-cl'></div>");
                            var but = $("<a class='b-button'>Сбросить заполнение</a>");
                            but.on("click", function () {
                                content();
                            });
                            tab.append(but);
                            but = $("<a class='b-button'>Сбросить по умолчанию</a>");
                            but.on("click", function () {
                                if (confirm("Вы уверены, что хотите сбросить настройки тактики? Это действие нельзя отменить")) {
                                    bt.skills = [];
                                    content();
                                }
                            });
                            tab.append(but);
                            but = $("<a class='b-button'>Сохранить тактику</a>");
                            but.on("click", saveBT);
                            tab.append(but);
                            tab.append("<div class='b-cl'></div>");
                            tab.find(".b-sort").sortable({distance: 5});
                            clearInterval(interval);
                        } else {
                            tab.append("<h2>Информация о способностях загружается... (если вы в бою, для загрузки завершите бой)</h2>");
                        }
                    }

                    content();
                    interval = setInterval(content, 1000);
                })();
                (function () {
                    var tab = optionTabs.targets;
                    TABS.targets = $("<div style='height:400px;overflow-y:scroll;'></div>");
                    tab.append("<h2 class='tab-title'>Цели для фарма и добычи</h2>");
                    tab.append("<div class='b-cl'></div>");
                    tab.append(TABS.targets);
                })();
                (function () {
                    var tab = optionTabs.export;
                    tab.append("<h2 class='tab-title'>Сохранение настроек</h2>");
                    var ta = $("<textarea style='width:96%;margin:5px 2%;height:200px;max-height: 200px;max-width:96%;' readonly></textarea>");

                    function select() {
                        system.copyToClipboard(ta[0]);
                    }

                    ta.on("click", select);
                    tab.append(ta);
                    var but = $("<a class='b-button' style='float:left;'>Обновить экспорт настроек</a>");
                    tab.append(but);
                    but.on("click", function () {
                        server.setOnSave(function (suc) {
                            if (suc) {
                                ta.val("setting save - success");
                            } else {
                                ta.val("setting save - error");
                            }
                        });
                        server.saveData();
                    });
                    but = $("<a class='b-button' style='float:left;'>Копировать</a>");
                    tab.append(but);
                    but.on("click", select);
                })();
                (function () {
                    var tab = optionTabs.stat;
                    tab.append("<h2 class='tab-title'>Статистика</h2>");
                    var div = $("<div style='height:400px;overflow-y:scroll;'></div>");
                    tab.append(div);
                    bLog.setExportDiv(div);
                    bLog.refreshStat();
                    var but = $("<a class='b-button' style='float:left;'>Обнулить статистику</a>");
                    tab.append(but);
                    but.on("click", function () {
                        bLog.setZero();
                    });
                })();
                (function () {
                    w.append(butWrap).append("<div class='b-cl'></div>");
                    w.append(tabWrap).append("<div class='b-cl'></div>");
                    w.disableSelection();
                })();
                (function () {
                    var css = "#__bot.b-hide{width:80px !important;}#__bot.b-hide *{display: none !important}#__bot.b-hide .b-smart{display:block !important;}";
                    css += "#__bot h2.tab-title{font-size: 18px;margin: 0 0 10px 0;padding: 10px 30px;text-align: left;background-color: #666;color: #fff;}";
                    css += "#__bot h3.tab-title{font-size: 13px;margin:0;padding: 5px 30px;text-align: left;}";
                    css += "#__bot .b-ability{padding:5px;background-color:#fff;}";
                    css += "#__bot .b-skill-cond-wrap{float:left;height:40px;line-height:40px;margin:0 10px;}";
                    css += "#__bot .b-skill-cond-wrap input[type=text]{padding:2px 5px;text-align:center;}";
                    css += "#__bot .b-and{float:left;height:40px;line-height:40px;margin:0 10px;font-weight:bold;font-size:16px;}";
                    css += "#__bot .b-float-block{float:left;margin:0 0 0 20px;line-height: 19px;}";
                    css += "#__bot .g-control{display:block;padding: 2px 10px;box-sizing:border-box;text-align:center;float:left;}";
                    css += "#__bot .off{color:red !important;font-weight:bold;}#__bot .on{color:green !important;font-weight:bold;}#__bot input[type=checkbox]{height: 13px;margin: 0 2px 0 0;}#__bot .hide{display:none;}#__bot .b-cl{clear:both;}#__bot a{cursor:pointer;}#__bot a:hover{text-decoration: underline;color:red;} #__bot h2{text-align:center;}#__bot p{padding:2px 0;margin:0;}#__bot p img{vertical-align:bottom;}";
                    css += "#__bot .b-button{display:block;float:right;padding:2px 10px;height:18px;margin:5px 10px;line-height:18px;text-align:center;color:#fff;background-color:#023F85;}";
                    css += "#b-stat-table{border-spacing: 0;width:96%;margin:5px 2%;border-top:2px solid #666;border-bottom:1px solid #666;border-left:2px solid #666;}";
                    css += "#b-stat-table tr th{padding:5px 10px;font-size:16px;border-top:1px solid #666;border-bottom:2px solid #666;border-right:2px solid #666;}";
                    css += "#b-stat-table tr td{padding:2px 5px;border-right:2px solid #666;border-bottom:1px solid #666;}";
                    w.before("<style>" + css + "</style>");
                })();
                _stat.refreshStat();
            })();
            (function () {
                setInterval(function t() {
                    time++;
                    $(_top().document).find("#error_div").css({display: "none"});
                    _stat.tick();
                }, 1000);
            })();
            locInfo.loadLocationInfo();
            setInterval(locInfo.loadLocationInfo, 2500);
        }

        function isComplete() {
            return window.top.document.readyState == "complete" && _top().document.readyState == "complete" && _top().frames['main_frame'].document.readyState == "complete";
        }

        var _i_limit = 5;
        var _i_interval = 5000;
        var _i = 0;
        var s;

        function serverConnect() {
            server.setOnLoad(function (suc) {
                if (suc) {
                    clearInterval(s);
                } else {
                    _i++;
                    if (_i > _i_limit) clearInterval(s);
                }
            });
            server.loadData();
        }

        s = setInterval(function () {
            if (isComplete()) {
                serverConnect();
            }
        }, _i_interval);
        serverConnect();
        var _____INT = setInterval(function () {
            if (isComplete()) {
                init();
                clearInterval(_____INT);
                console.log("BOT INIT COMPLETE");
            }
        }, 500);
    })();
    return (function () {
        var isLoad = true;
        var mobs = {};
        var i, b;
        for (i in SETTING.ATTACKED_BOTS) {
            b = SETTING.ATTACKED_BOTS[i];
            mobs[b.key] = b;
        }
        var resources = {};
        for (i in SETTING.FARM_RESOURCES) {
            b = SETTING.FARM_RESOURCES[i];
            resources[b.key] = b;
        }

        function updateMobs() {
            SETTING.ATTACKED_BOTS = [];
            for (k in mobs) SETTING.ATTACKED_BOTS.push(mobs[k]);
            SETTING.ATTACKED_BOTS.reverse();
            locInfo.refreshLocationInfo();
        }

        function updateResource() {
            SETTING.FARM_RESOURCES = [];
            for (k in resources) SETTING.FARM_RESOURCES.push(resources[k]);
            SETTING.FARM_RESOURCES.reverse();
            locInfo.refreshLocationInfo();
        }

        return {
            addMob: function (item) {
                if (!isLoad) return;
                item.active = true;
                var k = item.key;
                if (mobs[k] !== undefined) delete(mobs[k]);
                mobs[k] = item;
                updateMobs();
                return false;
            }, addResource: function (item) {
                if (!isLoad) return;
                var k = item.key;
                if (resources[k] !== undefined) delete(resources[k]);
                resources[k] = item;
                updateResource();
                return false;
            }, removeMob: function (key) {
                if (!isLoad) return;
                delete(mobs[key]);
                updateMobs();
            }, removeResource: function (key) {
                if (!isLoad) return;
                delete(resources[key]);
                updateResource();
            }
        };
    })();
})();
