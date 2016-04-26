angular.module('MyApp',['ngMaterial', 'ngMessages','appRoutes','mainCtrl','authService','userService','userCtrl','storyService','storyCtrl','reverseDirective'])

.config(function($httpProvider){
  $httpProvider.interceptors.push('AuthInterceptor');
})
