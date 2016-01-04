module.exports = function (grunt) {
  var start = new Date().getTime();
  grunt.initConfig({
    jshint: ['Gruntfile.js']
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  var end = new Date().getTime();
  console.log(end-start);
  grunt.registerTask('default', ['jshint']); // register a default task alias
  
};