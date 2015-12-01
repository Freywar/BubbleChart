module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    concat: {
      options: {
        sourceMap: true,
        banner: '(function(){"use strict";\n',
        process: function(src, filepath) {
          return '//region ' + filepath + '\n' + src + '\n//endregion';
        },
        footer: '\n})();',
        expand: true
      },
      debug: {
        files: {
          'dist/bubblechart.js': [ //TODO use requirejs for dependencies
            'src/core/**/*',
            'src/ui/export.js',
            'src/ui/base/primitives/enum.js',
            'src/ui/base/primitives/color.js',
            'src/ui/base/primitives/border.js',
            'src/ui/base/primitives/font.js',
            'src/ui/base/primitives/animatable.js',
            'src/ui/base/primitives/rect.js',
            'src/ui/base/primitives/spacing.js',
            'src/ui/base/*.js',
            'src/ui/bubblechart/bubble.js',
            'src/ui/bubblechart/data/*.js',
            'src/ui/bubblechart/plot/line.js',
            'src/ui/bubblechart/plot/scale.js',
            'src/ui/bubblechart/plot/controlcollection.js',
            'src/ui/bubblechart/plot/linecollection.js',
            'src/ui/bubblechart/plot/labelcollection.js',
            'src/ui/bubblechart/plot/axis.js',
            'src/ui/bubblechart/plot/plot.js',
            'src/ui/bubblechart/legend/*.js',
            'src/ui/bubblechart/slider/*.js',
            'src/ui/bubblechart/chart.js'
          ]
        }
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        banner: '(function(){"use strict";\n',
        process: function(src, filepath) {
          return '//region ' + filepath + '\n' + src + '\n//endregion';
        },
        footer: '\n})();',
        expand: true,
        mangle: false
      },
      release: {
        files: {
          'dist/bubblechart.min.js': [
            'src/core/**/*',
            'src/ui/export.js',
            'src/ui/base/primitives/enum.js',
            'src/ui/base/primitives/color.js',
            'src/ui/base/primitives/border.js',
            'src/ui/base/primitives/font.js',
            'src/ui/base/primitives/animatable.js',
            'src/ui/base/primitives/rect.js',
            'src/ui/base/primitives/spacing.js',
            'src/ui/base/*.js',
            'src/ui/bubblechart/bubble.js',
            'src/ui/bubblechart/data/*.js',
            'src/ui/bubblechart/plot/line.js',
            'src/ui/bubblechart/plot/scale.js',
            'src/ui/bubblechart/plot/controlcollection.js',
            'src/ui/bubblechart/plot/linecollection.js',
            'src/ui/bubblechart/plot/labelcollection.js',
            'src/ui/bubblechart/plot/axis.js',
            'src/ui/bubblechart/plot/plot.js',
            'src/ui/bubblechart/legend/*.js',
            'src/ui/bubblechart/slider/*.js',
            'src/ui/bubblechart/chart.js'
          ]
        }
      }
    },
    copy: {
      html: {
        expand: true,
        cwd: 'src/',
        src: '**/*.html',
        dest: 'dist/'
      }
    },
    watch: {
      scripts: {
        files: ['src/**/*.js', 'Gruntfile.js'],
        tasks: ['full']
      }
    }
  });


  grunt.registerTask('debug', ['concat:debug', 'copy:html']);
  grunt.registerTask('release', ['uglify:release', 'copy:html']);
  grunt.registerTask('full', ['concat:debug', 'uglify:release', 'copy:html']);

  grunt.registerTask('default', ['full', 'watch']);

};