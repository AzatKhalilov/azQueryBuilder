(function (root, factory) {
    if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
})(this, function () {
    angular.module('azQueryBuilder', [])
        .factory('azQueryBuilderCore', azQueryBuilderCore)
        .directive('azQueryBuilder', azQueryBuilder)
        .directive('azQueryBuilderRule', azQueryBuilderRule);

    function createUUID() {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        return s.join("");
    }

    var azQueryBuilderClass = function (options) {
        self = this;
        self.rules = options.rules || [];
        self.defaults = azQueryBuilderClass.DEFAULTS;
        self.condition = self.defaults.defaultCondition;
        self.filters = options.filters || [];
        self.filtersByKey = {};
        self.filters.forEach(function (item) {
            self.filtersByKey[item.name] = item;
        });
        self.operators = options.operators || azQueryBuilderClass.OPERATORS;
        self.draggable = options.hasOwnProperty('draggable') ? options.draggable : true;
        self.paddingDrop = options.hasOwnProperty('paddingDrop') ? options.paddingDrop : 5;
        self.createImageDrag = options.hasOwnProperty('createImageDrag') ? options.createImageDrag : true;
        self.onBeforeRemove = options.hasOwnProperty('onBeforeRemove') ? options.onBeforeRemove: function(){
            return true;
        }
    };

    azQueryBuilderClass.DEFAULTS = {
        conditions: ['AND', 'OR'],
        defaultCondition: 'AND'
    };

    azQueryBuilderClass.OPERATORS = {
        equal: {type: 'equal', label: '='},
        not_equal: {type: 'not_equal', label: '!='},
        in: {type: 'in', label: 'in'},
        not_in: {type: 'not_in', label: 'not in'},
        less: {type: 'less', label: "<"},
        less_or_equal: {type: 'less_or_equal', label: '<='},
        greater: {type: 'greater', label: '>'},
        greater_or_equal: {type: 'greater_or_equal', label: '>='},
        between: {type: 'between', label: 'between'},
        not_between: {type: 'not_between', label: 'not between'},
        begins_with: {type: 'begins_with', label: 'begin with'},
        not_begins_with: {type: 'not_begins_with', label: 'not begins with'},
        contains: {type: 'contains', label: 'contains'},
        not_contains: {type: 'not_contains', label: 'not contains'},
        ends_with: {type: 'ends_with', label: 'ends with'},
        not_ends_with: {type: 'not_ends_with', label: 'not ends with'},
        is_empty: {type: 'is_empty', label: 'is empty'},
        is_not_empty: {type: 'is_not_empty', label: 'is not empty'},
        is_null: {type: 'is_null', label: 'is null'},
        is_not_null: {type: 'is_not_null', label: 'is not null'}
    };


    azQueryBuilderClass.prototype.addGroup = function (parent) {
        parent.rules.push({
                parent: parent,
                id: createUUID(),
                condition: this.defaults.defaultCondition,
                rules: [],
                isGroup: true
            }
        );
    };

    azQueryBuilderClass.prototype.addRule = function (parent) {
        parent.rules.push({parent: parent, id: createUUID()});
    };

    azQueryBuilderClass.prototype.removeRule = function (rule) {
        rule.parent.rules.some(function (item, index) {
            if (item == rule) {
                rule.parent.rules.splice(index, 1);
                return true;
            }
        })
    };

    azQueryBuilderClass.prototype.changeCondition = function (group) {

    };


    azQueryBuilderClass.prototype.setDraggable = function (element, rule) {

    };

    /**
     *
     *
     */
    azQueryBuilderCore.$inject = [];
    function azQueryBuilderCore() {

    }

    /**
     *
     *
     */
    azQueryBuilder.$inject = [];
    function azQueryBuilder() {


        function getTemplate(element, attrs) {
            return attrs.templateUrl ? attrs.templateUrl : 'src/template/azQueryBuilder.html';
        }

        function QueryBuilderController($scope) {
            var self = this;
            self.queryBuilder = new azQueryBuilderClass($scope.options);
            $scope.rule = self.queryBuilder;
            $scope.queryBuilder = self.queryBuilder;

            $scope.rules = self.queryBuilder.rules;

            self.addGroup = function (parent) {
                $scope.rule.addGroup(parent)
            };
            self.addRule = function (parent) {
                $scope.rule.addRule(parent);
            };
            self.removeRule = function (rule) {
                if (angular.isFunction(self.queryBuilder.onBeforeRemove)){
                    var result = self.queryBuilder.onBeforeRemove(rule)
                    if (typeof result == 'object' && result.then){
                        result.then(function(){
                            self.queryBuilder.removeRule(rule);
                        })
                        return;
                    }
                    if (typeof result == 'boolean' && result){
                        self.queryBuilder.removeRule(rule);
                    }
                }
                else {
                    self.queryBuilder.removeRule(rule);
                }

            };


            $scope.addGroup = function () {
                self.addGroup($scope)
            };

            $scope.addRule = function () {
                self.addRule($scope)
            };
            $scope.setCondition = function (condition) {
                $scope.rule.condition = condition;
            };

        }

        function QueryBuilderLink() {

        }

        return {
            restrict: 'E',
            replace:true,
            templateUrl: getTemplate,
            scope: {
                templateUrl: '@',
                options: '='
            },
            controller: ['$scope', QueryBuilderController],
            link: QueryBuilderLink
        }
    }

    /**
     *
     *
     */
    azQueryBuilderRule.$inject = [];
    function azQueryBuilderRule() {
        var dragInfo = {
            target:null,
            scope:null,
            rule:null
        };

        function getTemplate(element, attrs) {
            var template = attrs.templateUrl ? attrs.templateUrl : 'src/template/azQueryBuilderRule.html';
            return template;
        }

        function QueryBuilderRuleController($scope) {


        }

        function QueryBuilderRuleLink($scope, $element, $attrs, controller) {

            function topOrBottom(event,targetNode,padding){
                var mousePointer =  event.offsetY;
                var targetSize = targetNode[0].clientHeight;
                var targetPosition = targetNode[0].offsetTop;
                if (mousePointer<=padding){
                    $element.addClass('dragTop');
                    $element.removeClass('dragBottom');
                    dragInfo.whereDrop = 'previous';
                }
                if (mousePointer>=targetSize-padding) {
                    $element.addClass('dragBottom');
                    $element.removeClass('dragTop');
                    dragInfo.whereDrop = 'next'
                }
            }

            function dropAllowed(){
                if (dragInfo.rule == null) {
                    return false;
                }
                return true
            }

            var builderController = controller[0];
            $scope.queryBuilder = builderController.queryBuilder;
            $scope.rules = $scope.rule.rules;
            $scope.addGroup = function () {
                builderController.addGroup($scope.rule);
            };

            $scope.addRule = function () {
                builderController.addRule($scope.rule);
            };

            $scope.removeGroup = function () {
                builderController.removeRule($scope.rule);
            };
            $scope.removeRule = function () {
                builderController.removeRule($scope.rule);
            };
            $scope.changeCondition = function () {
                builderController.changeCondition($scope.rule);
            };
            $scope.setCondition = function (condition) {
                $scope.rule.condition = condition;
            };

            $element[0].draggable = builderController.queryBuilder.draggable;


            $element.on('dragstart',function(e){
                var event = e.originalEvent || e;
                dragInfo.target = event.target;
                dragInfo.rule = $scope.rule;
                dragInfo.scope = $scope;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData("Text", '');
                $element.addClass('dragRule');
                if (builderController.queryBuilder.createImageDrag){
                    event.dataTransfer.setDragImage($element[0],0,0)
                }
                event.stopPropagation();
            });

            $element.on('dragend',function(e){
                var event = e.originalEvent || e;
                dragInfo.target = null;
                dragInfo.scope = null;
                dragInfo.currentOverClass ='';
                $element.removeClass('dragTop');
                $element.removeClass('dragBottom');
                $element.removeClass('dragRule');
                event.stopPropagation();
            });

            $element.on('dragenter',function(e){
                var event = e.originalEvent || e;
                if (!dropAllowed){
                    return true;
                }
                event.preventDefault();
            });

            $element.on('dragleave',function(e){
                var event = e.originalEvent || e;
                $element.removeClass('dragTop');
                $element.removeClass('dragBottom');
            });

            $element.on('dragover',function(e){
                var event = e.originalEvent || e;
                event.stopPropagation();
                event.preventDefault();
                if ($element[0] === dragInfo.target) {
                    return true;
                }
                topOrBottom(event,$element,builderController.queryBuilder.paddingDrop);
                return false;
            });

            $element.on('drop',function(e){
                var event = e.originalEvent || e;
                if (!dropAllowed() ||$element[0] === dragInfo.target){
                    return true;
                }
                event.stopPropagation();
                event.preventDefault();
                dragInfo.currentOverClass = '';
                dragInfo.rule.parent.rules.some(function(item,index){
                    if (item!=dragInfo.rule) return false;
                    dragInfo.rule.parent.rules.splice(index,1);
                    return true;
                });
                for (var i=0;i<$scope.rule.parent.rules.length;i++){
                    if ($scope.rule.parent.rules[i]!= $scope.rule){
                        continue;
                    }
                    $scope.rule.parent.rules.splice(dragInfo.whereDrop =='previous'?i:i+1,0,dragInfo.rule);
                    dragInfo.rule.parent = $scope.rule.parent;
                    break;
                }
                $scope.$evalAsync();
                $element.removeClass('dragTop');
                $element.removeClass('dragBottom');
                return false;
            });
        }

        return {
            restrict: 'E',
            require: ['^azQueryBuilder', 'ngModel'],
            replace: true,
            templateUrl: getTemplate,
            scope: {
                templateUrl: '@',
                rule: '=ngModel'
            },
            link: QueryBuilderRuleLink,
            controller: ['$scope', QueryBuilderRuleController]
        }

    }

    return {}

    // $templateCache.put('template/azQueryBuilder.html',["<div class=\"query-builder\">",
    //     "<div class=\"group-rule\">",
    //     "<div>",
    //     "<select ng-options=\"item as item for item in queryBuilder.defaults.conditions\"",
    //     "ng-model=\"queryBuilder.condition\">",
    //     "</select>",
    //     "<button ng-click=\"addGroup()\">Add group</button>",
    //     "<button ng-click=\"addRule()\">Add rule</button>",
    //     "</div>",
    //     "<ul class=\"rules-list\">",
    //     "<li class=\"rule-container\" ng-repeat=\"rule in rules track by rule.id\" ng-model=\"rule\">",
    //     "<az-query-builder-rule ng-model=\"rule\"></az-query-builder-rule>",
    //     "</li></ul></div></div>"].join(''));
});